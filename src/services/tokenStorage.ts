/**
 * Holds the short-lived access token in module memory only.
 *
 * It is deliberately NOT written to `localStorage` or `sessionStorage`: anything
 * readable by JavaScript is reachable by an injected script, whereas a closure
 * variable is not. The long-lived refresh token lives in an httpOnly cookie set
 * by the API, so a full page reload re-bootstraps the session through
 * `POST /auth/refresh`.
 */
let accessToken: string | null = null;

export const tokenStorage = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
  },
  clear: (): void => {
    accessToken = null;
  },
  has: (): boolean => accessToken !== null,
};
