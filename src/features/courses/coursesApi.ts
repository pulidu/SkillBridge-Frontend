import { api, listKey } from '@/app/api';
import { toPaginated } from '@/services/apiClient';
import type {
  Course,
  CourseAnalytics,
  CourseLevel,
  CourseSort,
  CourseStatus,
  EnrollmentDetail,
  Paginated,
  Rating,
  RatingSummary,
  User,
} from '@/types';

export interface ListCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  instructor?: string;
  sort?: CourseSort;
  minRating?: number;
  maxPrice?: number;
  tag?: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  category: string;
  instructor?: string;
  level?: CourseLevel;
  price?: number;
  currency?: string;
  tags?: string[];
  outcomes?: string[];
  requirements?: string[];
}

export type UpdateCourseRequest = Partial<CreateCourseRequest>;

export interface CreateRatingRequest {
  value: number;
  review?: string;
}

export const coursesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCourses: builder.query<Paginated<Course>, ListCoursesParams | void>({
      query: (params) => ({ url: '/courses', params: { ...params } }),
      transformResponse: (response: Course[], meta) => toPaginated(response, meta),
      providesTags: (result, _error, params) => [
        ...(result
          ? result.items.map(({ id }) => ({ type: 'Course' as const, id }))
          : [{ type: 'Course' as const, id: listKey('LIST', params ?? {}) }]),
        'Course',
      ],
    }),

    listFeaturedCourses: builder.query<Course[], void>({
      query: () => ({ url: '/courses/featured' }),
      transformResponse: (response: Course[]) => response ?? [],
      providesTags: ['Course'],
    }),

    getCourse: builder.query<Course, string>({
      query: (id) => ({ url: `/courses/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Course', id }],
    }),

    /** Public catalog pages address courses by slug, not by ObjectId. */
    getCourseBySlug: builder.query<Course, string>({
      query: (slug) => ({ url: `/courses/slug/${slug}` }),
      providesTags: ['Course'],
    }),

    createCourse: builder.mutation<Course, CreateCourseRequest>({
      query: (body) => ({ url: '/courses', method: 'POST', body }),
      invalidatesTags: ['Course', 'Dashboard'],
    }),

    updateCourse: builder.mutation<Course, { id: string; body: UpdateCourseRequest }>({
      query: ({ id, body }) => ({ url: `/courses/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Course', id }, 'Course', 'Dashboard'],
    }),

    deleteCourse: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/courses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Course', 'Enrollment', 'Dashboard'],
    }),

    publishCourse: builder.mutation<Course, string>({
      query: (id) => ({ url: `/courses/${id}/publish`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Course', id }, 'Course', 'Dashboard'],
    }),

    unpublishCourse: builder.mutation<Course, string>({
      query: (id) => ({ url: `/courses/${id}/unpublish`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Course', id }, 'Course', 'Dashboard'],
    }),

    archiveCourse: builder.mutation<Course, string>({
      query: (id) => ({ url: `/courses/${id}/archive`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Course', id }, 'Course', 'Dashboard'],
    }),

    assignCourseInstructor: builder.mutation<Course, { id: string; instructor: string }>({
      query: ({ id, instructor }) => ({
        url: `/courses/${id}/instructor`,
        method: 'PATCH',
        body: { instructor },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Course', id }, 'Course', 'User'],
    }),

    getCourseAnalytics: builder.query<CourseAnalytics, string>({
      query: (id) => ({ url: `/courses/${id}/analytics` }),
      providesTags: (_result, _error, id) => [{ type: 'Course', id }, 'Dashboard'],
    }),

    getCourseStudents: builder.query<Paginated<EnrollmentDetail>, { id: string; page?: number; limit?: number }>({
      query: ({ id, ...params }) => ({ url: `/courses/${id}/students`, params }),
      transformResponse: (response: EnrollmentDetail[], meta) => toPaginated(response, meta),
      providesTags: (_result, _error, { id }) => [{ type: 'Course', id }, 'Enrollment'],
    }),

    listCourseRatings: builder.query<
      Paginated<Rating> & { summary: RatingSummary },
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, ...params }) => ({ url: `/courses/${id}/ratings`, params }),
      transformResponse: (response: Rating[], meta) => {
        const paginated = toPaginated(response, meta);
        const summary: RatingSummary = { average: 0, count: paginated.items.length, breakdown: {} };

        paginated.items.forEach((rating) => {
          const key = String(rating.value);
          summary.breakdown[key] = (summary.breakdown[key] ?? 0) + 1;
          summary.average += rating.value;
        });

        summary.average =
          summary.count > 0 ? Number((summary.average / summary.count).toFixed(2)) : 0;

        return { ...paginated, summary };
      },
      providesTags: (_result, _error, { id }) => [{ type: 'Course', id }],
    }),

    rateCourse: builder.mutation<Rating, { id: string; body: CreateRatingRequest }>({
      query: ({ id, body }) => ({ url: `/courses/${id}/ratings`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Course', id }, 'Course'],
    }),
  }),
});

export const {
  useListCoursesQuery,
  useListFeaturedCoursesQuery,
  useGetCourseQuery,
  useGetCourseBySlugQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useUnpublishCourseMutation,
  useArchiveCourseMutation,
  useAssignCourseInstructorMutation,
  useGetCourseAnalyticsQuery,
  useGetCourseStudentsQuery,
  useListCourseRatingsQuery,
  useRateCourseMutation,
} = coursesApi;

/** Re-exported so instructor pages do not need to import two modules. */
export type { User };
