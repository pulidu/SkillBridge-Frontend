import { api, listKey } from '@/app/api';
import { toPaginated } from '@/services/apiClient';
import type { Enrollment, EnrollmentDetail, EnrollmentStatus, Paginated } from '@/types';

export interface CreateEnrollmentRequest {
  course: string;
  /** Only honoured for admin-initiated enrolment. */
  student?: string;
}

export interface ListEnrollmentsParams {
  page?: number;
  limit?: number;
  course?: string;
  student?: string;
  status?: EnrollmentStatus;
}

export interface UpdateEnrollmentRequest {
  status?: EnrollmentStatus;
  finalScore?: number;
}

export const enrollmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** Self-service enrolment. Always enrols the authenticated student. */
    enroll: builder.mutation<Enrollment, CreateEnrollmentRequest>({
      query: (body) => ({ url: '/enrollments', method: 'POST', body }),
      invalidatesTags: ['Enrollment', 'Progress', 'Course', 'Dashboard', 'Notification'],
    }),

    getMyEnrollments: builder.query<Paginated<EnrollmentDetail>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/users/me/enrollments', params: { ...params } }),
      transformResponse: (response: EnrollmentDetail[], meta) => toPaginated(response, meta),
      providesTags: (result, _error, params) => [
        ...(result
          ? result.items.map(({ id }) => ({ type: 'Enrollment' as const, id }))
          : [{ type: 'Enrollment' as const, id: listKey('MINE', params ?? {}) }]),
        'Enrollment',
      ],
    }),

    getEnrollment: builder.query<EnrollmentDetail, string>({
      query: (id) => ({ url: `/enrollments/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Enrollment', id }],
    }),

    listEnrollments: builder.query<Paginated<Enrollment>, ListEnrollmentsParams | void>({
      query: (params) => ({ url: '/enrollments', params: { ...params } }),
      transformResponse: (response: Enrollment[], meta) => toPaginated(response, meta),
      providesTags: (result, _error, params) => [
        ...(result
          ? result.items.map(({ id }) => ({ type: 'Enrollment' as const, id }))
          : [{ type: 'Enrollment' as const, id: listKey('ALL', params ?? {}) }]),
        'Enrollment',
      ],
    }),

    updateEnrollment: builder.mutation<Enrollment, { id: string; body: UpdateEnrollmentRequest }>({
      query: ({ id, body }) => ({ url: `/enrollments/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Enrollment', id }, 'Enrollment', 'Progress'],
    }),

    cancelEnrollment: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/enrollments/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Enrollment', id }, 'Enrollment', 'Progress'],
    }),
  }),
});

export const {
  useEnrollMutation,
  useGetMyEnrollmentsQuery,
  useGetEnrollmentQuery,
  useListEnrollmentsQuery,
  useUpdateEnrollmentMutation,
  useCancelEnrollmentMutation,
} = enrollmentsApi;
