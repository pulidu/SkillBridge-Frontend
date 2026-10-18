import { api } from '@/app/api';
import type { EnrollmentProgressDetail, ProgressSummary } from '@/types';

export const progressApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** Aggregate progress across every enrolment the student owns. */
    getMyProgress: builder.query<ProgressSummary, void>({
      query: () => ({ url: '/progress/me' }),
      providesTags: ['Progress'],
    }),

    getEnrollmentProgress: builder.query<EnrollmentProgressDetail, string>({
      query: (enrollmentId) => ({ url: `/progress/enrollment/${enrollmentId}` }),
      providesTags: (_result, _error, enrollmentId) => [
        { type: 'Enrollment', id: enrollmentId },
        'Progress',
      ],
    }),

    /**
     * Marking a lesson complete recalculates the enrolment percentage server
     * side, so the client never computes progress itself.
     */
    completeLesson: builder.mutation<EnrollmentProgressDetail, string>({
      query: (lessonId) => ({ url: `/progress/lessons/${lessonId}/complete`, method: 'POST' }),
      invalidatesTags: ['Progress', 'Enrollment', 'Certificate', 'Dashboard'],
    }),

    incompleteLesson: builder.mutation<EnrollmentProgressDetail, string>({
      query: (lessonId) => ({ url: `/progress/lessons/${lessonId}/incomplete`, method: 'POST' }),
      invalidatesTags: ['Progress', 'Enrollment', 'Dashboard'],
    }),
  }),
});

export const {
  useGetMyProgressQuery,
  useGetEnrollmentProgressQuery,
  useCompleteLessonMutation,
  useIncompleteLessonMutation,
} = progressApi;
