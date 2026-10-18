import { api } from '@/app/api';
import { tokenStorage } from '@/services/tokenStorage';
import type { AuthPayload, User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Re-establishes a session after a page reload using the refresh cookie. */
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthPayload, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),

    register: builder.mutation<AuthPayload, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      // Signing out must not leave cached data behind, so the whole RTK Query
      // cache is dropped once the API has accepted the revocation.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          /* the local session is cleared regardless */
        }
        dispatch(authApi.util.resetApiState());
      },
    }),

    /** Used once on app start to convert the refresh cookie into a session. */
    refreshSession: builder.query<AuthPayload, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      providesTags: ['Auth'],
    }),

    getProfile: builder.query<User, void>({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Auth', 'User'],
    }),

    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['Auth', 'User'],
    }),

    changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      query: (body) => ({ url: '/auth/password', method: 'PATCH', body }),
      // The API clears the refresh cookie, so force a fresh sign-in.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          tokenStorage.clear();
          dispatch(authApi.util.resetApiState());
        } catch {
          /* surfaced through the mutation's error state */
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshSessionQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;
