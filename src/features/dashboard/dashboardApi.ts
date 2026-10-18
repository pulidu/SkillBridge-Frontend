import { api } from '@/app/api';
import type { AdminDashboard, InstructorDashboard, StudentDashboard } from '@/types';

/**
 * Three separate endpoints rather than one payload that changes shape: each role
 * only ever receives the figures it is allowed to see.
 */
export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStudentDashboard: builder.query<StudentDashboard, void>({
      query: () => ({ url: '/dashboard/student' }),
      providesTags: ['Dashboard'],
    }),

    getInstructorDashboard: builder.query<InstructorDashboard, void>({
      query: () => ({ url: '/dashboard/instructor' }),
      providesTags: ['Dashboard'],
    }),

    getAdminDashboard: builder.query<AdminDashboard, void>({
      query: () => ({ url: '/dashboard/admin' }),
      providesTags: ['Dashboard', 'User', 'Course'],
    }),
  }),
});

export const {
  useGetStudentDashboardQuery,
  useGetInstructorDashboardQuery,
  useGetAdminDashboardQuery,
} = dashboardApi;
