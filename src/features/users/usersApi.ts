import { api, listKey } from '@/app/api';
import { toPaginated } from '@/services/apiClient';
import type { AuditLog, Paginated, Role, User, UserStatus } from '@/types';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: Role;
  status?: UserStatus;
  search?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * Admin-only account creation. Public registration cannot produce a privileged
 * role, so this endpoint is the only way an instructor account comes into
 * existence. `role` is narrowed to the two privileged roles to match the API.
 */
export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: Extract<Role, 'instructor' | 'admin'>;
  bio?: string;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  actor?: string;
  entity?: string;
  action?: string;
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<Paginated<User>, ListUsersParams | void>({
      query: (params) => ({ url: '/users', params: { ...params } }),
      transformResponse: (response: User[], meta) => toPaginated(response, meta),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'User' as const, id })),
              'User',
            ]
          : ['User'],
    }),

    getUser: builder.query<User, string>({
      query: (id) => ({ url: `/users/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<User, CreateUserRequest>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User', 'AuditLog'],
    }),

    updateUser: builder.mutation<User, { id: string; body: UpdateUserRequest }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User', 'Auth'],
    }),

    updateUserRole: builder.mutation<User, { id: string; role: Role }>({
      query: ({ id, role }) => ({ url: `/users/${id}/role`, method: 'PATCH', body: { role } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    updateUserStatus: builder.mutation<User, { id: string; status: UserStatus }>({
      query: ({ id, status }) => ({ url: `/users/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User', 'Course', 'Enrollment'],
    }),

    /** Administrative audit trail. Mounted at `/users/audit-logs` by the API. */
    listAuditLogs: builder.query<Paginated<AuditLog>, ListAuditLogsParams | void>({
      query: (params) => ({ url: '/users/audit-logs', params: { ...params } }),
      transformResponse: (response: AuditLog[], meta) => toPaginated(response, meta),
      providesTags: (result, _error, params) => [
        ...(result ? [{ type: 'AuditLog' as const, id: listKey('audit', params ?? {}) }] : []),
        'AuditLog',
      ],
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useListAuditLogsQuery,
} = usersApi;
