import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { tokenStorage } from '@/services/tokenStorage';
import type { AuthPayload, Role, User } from '@/types';
import { authApi } from './authApi';

export type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';

export interface AuthState {
  user: User | null;
  status: SessionStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

/**
 * Runs once when the application mounts. The refresh token is an httpOnly
 * cookie, so a page reload has no access token in memory and must exchange the
 * cookie for a new one before any protected route can render.
 */
export const bootstrapSession = createAsyncThunk<AuthPayload | null, void>(
  'auth/bootstrap',
  async (_arg, { dispatch }) => {
    try {
      return await dispatch(authApi.endpoints.refreshSession.initiate(undefined, { subscribe: false })).unwrap();
    } catch {
      return null;
    }
  },
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called by the login and register pages once the API responds. */
    sessionReceived(state, action: PayloadAction<AuthPayload>) {
      state.user = action.payload.user;
      state.status = 'authenticated';
      state.error = null;
    },

    /** Local teardown. Also used when a refresh attempt fails. */
    sessionCleared(state) {
      state.user = null;
      state.status = 'anonymous';
      state.error = null;
      tokenStorage.clear();
    },

    sessionFailed(state, action: PayloadAction<string>) {
      state.user = null;
      state.status = 'anonymous';
      state.error = action.payload;
      tokenStorage.clear();
    },

    /** Keeps the cached profile in step with a successful profile update. */
    profileUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.user = action.payload?.user ?? null;
        state.status = action.payload ? 'authenticated' : 'anonymous';
        state.error = null;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.user = null;
        state.status = 'anonymous';
      });
  },
});

export const { sessionReceived, sessionCleared, sessionFailed, profileUpdated } = authSlice.actions;

export const authReducer = authSlice.reducer;

/* -------------------------------- selectors -------------------------------- */

type AuthRootState = { auth: AuthState };

export const selectUser = (state: AuthRootState): User | null => state.auth.user;

export const selectStatus = (state: AuthRootState): SessionStatus => state.auth.status;

export const selectIsAuthenticated = (state: AuthRootState): boolean =>
  state.auth.status === 'authenticated' && state.auth.user !== null;

export const selectRoles = (state: AuthRootState): Role[] => state.auth.user?.roles ?? [];

export const selectPrimaryRole = (state: AuthRootState): Role => {
  if (state.auth.user?.primaryRole) return state.auth.user.primaryRole;
  const roles = selectRoles(state);
  const priority: Role[] = ['admin', 'instructor', 'student'];
  return priority.find((role) => roles.includes(role)) ?? 'student';
};

export const selectHasRole =
  (allowed: readonly Role[]) =>
  (state: AuthRootState): boolean => {
    const roles = selectRoles(state);
    return allowed.some((role) => roles.includes(role));
  };

/** Dashboard landing route for a role, used by the `/dashboard` redirect. */
export const dashboardPathFor = (role: Role): string => {
  if (role === 'admin') return '/admin';
  if (role === 'instructor') return '/instructor';
  return '/learn';
};
