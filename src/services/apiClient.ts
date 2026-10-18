import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { API_BASE_URL, REFRESH_ENDPOINT } from '@/lib/constants';
import type { ApiResult, FieldError, Paginated, PaginationMeta } from '@/types';
import { tokenStorage } from './tokenStorage';

/** Shape accepted by every RTK Query endpoint in `features/`. */
export interface QueryArgs {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

/** Error payload surfaced through RTK Query's `error` property. */
export interface ApiErrorPayload {
  status: number;
  message: string;
  errors?: FieldError[];
}

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

type Params = QueryArgs['params'];

const buildUrl = (url: string, params?: Params): string => {
  const path = url.startsWith('/') ? url : `/${url}`;
  const base = `${API_BASE_URL}${path}`;
  if (!params) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }

  const query = search.toString();
  return query ? `${base}?${query}` : base;
};

/** Narrowing helper: the auth endpoints answer with `{ user, accessToken }`. */
const extractAccessToken = (data: unknown): string | null => {
  if (data && typeof data === 'object' && 'accessToken' in data) {
    const token = (data as { accessToken?: unknown }).accessToken;
    return typeof token === 'string' ? token : null;
  }
  return null;
};

/**
 * Invoked once when the refresh session can no longer be recovered, so the app
 * can drop the client session and let `ProtectedRoute` send the user back
 * through the normal login flow. Registered by `App`.
 */
type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export const onSessionExpired = (handler: SessionExpiredHandler): void => {
  sessionExpiredHandler = handler;
};

/**
 * Set once a refresh is rejected because the refresh token is missing, expired
 * or revoked. Further 401s must not keep hitting `/auth/refresh`; the flag is
 * lifted as soon as a new access token is issued (login, register or refresh).
 */
let refreshBlocked = false;
let sessionExpiredNotified = false;

/** Drops the client session and notifies the app exactly once per expiry. */
const markSessionExpired = (): void => {
  tokenStorage.clear();
  if (sessionExpiredNotified) return;

  sessionExpiredNotified = true;
  sessionExpiredHandler?.();
};

/**
 * Single fetch call against the API. Never throws: transport failures are
 * normalised into the same `{ ok: false }` result shape as HTTP errors so
 * callers have exactly one error path to handle.
 */
export const rawRequest = async <T>(
  url: string,
  options: { method?: QueryArgs['method']; body?: unknown; params?: Params } = {},
): Promise<ApiResult<T>> => {
  const { method = 'GET', body, params } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(buildUrl(url, params), {
      method,
      headers,
      // Required for the httpOnly refresh cookie.
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 204) {
      return { ok: true, status: 204, data: undefined as T };
    }

    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; data?: T; meta?: PaginationMeta; message?: string; errors?: FieldError[] }
      | null;

    if (!response.ok || !payload?.success) {
      return {
        ok: false,
        status: response.status,
        message: payload?.message ?? `Request failed with status ${response.status}`,
        errors: payload?.errors,
      };
    }

    // Any endpoint that issues a new access token updates memory for free,
    // which keeps login and refresh rotation on a single code path.
    const issued = extractAccessToken(payload.data);
    if (issued) {
      tokenStorage.set(issued);
      // A fresh token means the session is healthy again, so allow a future
      // expiry to trigger another automatic renewal.
      refreshBlocked = false;
      sessionExpiredNotified = false;
    }

    return payload.meta
      ? { ok: true, status: response.status, data: payload.data as T, meta: payload.meta }
      : { ok: true, status: response.status, data: payload.data as T };
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'Unable to reach the server. Check your connection and try again.',
    };
  }
};

/**
 * De-duplicates concurrent refresh attempts. Without this, several queries
 * failing with 401 at the same moment would each rotate the refresh cookie and
 * invalidate one another.
 */
let refreshInFlight: Promise<boolean> | null = null;

export const refreshSession = (): Promise<boolean> => {
  // No point calling the endpoint again when the refresh token was already
  // rejected; only a fresh login can restore the session.
  if (refreshBlocked) return Promise.resolve(false);

  if (!refreshInFlight) {
    refreshInFlight = rawRequest<{ accessToken: string }>(REFRESH_ENDPOINT, { method: 'POST' })
      .then((result) => {
        // 401/403 means the refresh token is missing, expired or revoked and
        // cannot be recovered without signing in again.
        if (!result.ok && (result.status === 401 || result.status === 403)) {
          refreshBlocked = true;
        }
        return result.ok;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
};

/**
 * RTK Query base query: attaches the bearer token and transparently retries
 * once after a successful refresh when the API answers 401.
 */
/**
 * RTK Query's `createApi` fixes the base query's meta generic to `{}`, so the
 * pagination block arrives here untyped and is narrowed at runtime instead.
 */
const asPaginationMeta = (meta: unknown): PaginationMeta | undefined => {
  if (!meta || typeof meta !== 'object') return undefined;
  const candidate = meta as Partial<PaginationMeta>;
  return typeof candidate.page === 'number' && typeof candidate.total === 'number'
    ? (candidate as PaginationMeta)
    : undefined;
};

export const apiBaseQuery: BaseQueryFn<QueryArgs, unknown, ApiErrorPayload> = async (args) => {
  const send = (): Promise<ApiResult<unknown>> =>
    rawRequest<unknown>(args.url, { method: args.method, body: args.body, params: args.params });

  const tokenBefore = tokenStorage.get();
  let result = await send();
  const isAuthRoute = args.url.startsWith('/auth');

  if (!result.ok && result.status === 401 && !isAuthRoute) {
    if (await refreshSession()) {
      // Retry the original request exactly once with the renewed token.
      result = await send();
    } else if (tokenStorage.get() !== tokenBefore) {
      // A concurrent renewal (for example the on-load session bootstrap) has
      // already produced a fresh token, so retry rather than tear the session
      // down over a race between two refreshes.
      refreshBlocked = false;
      sessionExpiredNotified = false;
      result = await send();
    } else {
      // The refresh session is gone: clear it and redirect through login.
      markSessionExpired();
    }
  }

  if (result.ok) {
    return result.meta
      ? { data: result.data, meta: result.meta }
      : { data: result.data };
  }

  return {
    error: {
      status: result.status,
      message: result.message,
      errors: result.errors,
    },
  };
};

/** Normalises a list response plus its pagination block into `Paginated<T>`. */
export const toPaginated = <T>(items: T[], meta?: unknown): Paginated<T> => ({
  items: items ?? [],
  meta: asPaginationMeta(meta) ?? EMPTY_META,
});
