import { api } from '@/app/api';
import { toPaginated } from '@/services/apiClient';
import type { AppNotification, NotificationType, Paginated } from '@/types';

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: NotificationType;
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<Paginated<AppNotification>, ListNotificationsParams | void>({
      query: (params) => ({ url: '/users/me/notifications', params: { ...params } }),
      transformResponse: (response: AppNotification[], meta) => toPaginated(response, meta),
      providesTags: (result) => [
        'Notification',
        ...(result ? [{ type: 'Notification' as const, id: 'LIST' }] : []),
      ],
    }),

    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => ({ url: '/users/me/notifications/unread-count' }),
      transformResponse: (response: { count: number } | number) =>
        typeof response === 'number' ? { count: response } : { count: response?.count ?? 0 },
      providesTags: ['Notification'],
    }),

    markAsRead: builder.mutation<AppNotification, string>({
      query: (id) => ({ url: `/users/me/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),

    markAllAsRead: builder.mutation<{ message: string }, void>({
      query: () => ({ url: '/users/me/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/users/me/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
