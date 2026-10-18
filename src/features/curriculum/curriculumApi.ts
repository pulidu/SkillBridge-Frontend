import { api } from '@/app/api';
import type { Category, CourseModule, Curriculum, Lesson, LessonType } from '@/types';

export interface CreateModuleRequest {
  title: string;
  description?: string;
  position?: number;
}

export type UpdateModuleRequest = Partial<CreateModuleRequest>;

export interface CreateLessonRequest {
  title: string;
  module?: string;
  content?: string;
  videoUrl?: string;
  attachments?: Array<{ name: string; url: string; size: number; mimeType?: string }>;
  type?: LessonType;
  durationMinutes?: number;
  isPreview?: boolean;
  isPublished?: boolean;
  position?: number;
}

export type UpdateLessonRequest = Partial<CreateLessonRequest>;

export const curriculumApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCurriculum: builder.query<Curriculum, { courseId: string; includeUnpublished?: boolean }>({
      query: ({ courseId, includeUnpublished }) => ({
        url: `/courses/${courseId}/curriculum`,
        params: { includeUnpublished },
      }),
      providesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Module',
        'Lesson',
      ],
    }),

    listModules: builder.query<CourseModule[], string>({
      query: (courseId) => ({ url: `/courses/${courseId}/modules` }),
      transformResponse: (response: CourseModule[]) => response ?? [],
      providesTags: (_result, _error, courseId) => [
        { type: 'Course', id: courseId },
        'Module',
      ],
    }),

    createModule: builder.mutation<CourseModule, { courseId: string; body: CreateModuleRequest }>({
      query: ({ courseId, body }) => ({ url: `/courses/${courseId}/modules`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Module',
        'Lesson',
      ],
    }),

    updateModule: builder.mutation<
      CourseModule,
      { courseId: string; moduleId: string; body: UpdateModuleRequest }
    >({
      query: ({ courseId, moduleId, body }) => ({
        url: `/courses/${courseId}/modules/${moduleId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Module',
      ],
    }),

    deleteModule: builder.mutation<{ message: string }, { courseId: string; moduleId: string }>({
      query: ({ courseId, moduleId }) => ({
        url: `/courses/${courseId}/modules/${moduleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Module',
        'Lesson',
      ],
    }),

    listLessons: builder.query<Lesson[], { courseId: string; module?: string }>({
      query: ({ courseId, module }) => ({ url: `/courses/${courseId}/lessons`, params: { module } }),
      transformResponse: (response: Lesson[]) => response ?? [],
      providesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Lesson',
      ],
    }),

    getLesson: builder.query<Lesson, { courseId: string; lessonId: string }>({
      query: ({ courseId, lessonId }) => ({ url: `/courses/${courseId}/lessons/${lessonId}` }),
      providesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Lesson',
      ],
    }),

    createLesson: builder.mutation<Lesson, { courseId: string; body: CreateLessonRequest }>({
      query: ({ courseId, body }) => ({ url: `/courses/${courseId}/lessons`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Lesson',
        'Enrollment',
      ],
    }),

    updateLesson: builder.mutation<
      Lesson,
      { courseId: string; lessonId: string; body: UpdateLessonRequest }
    >({
      query: ({ courseId, lessonId, body }) => ({
        url: `/courses/${courseId}/lessons/${lessonId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Lesson',
      ],
    }),

    deleteLesson: builder.mutation<{ message: string }, { courseId: string; lessonId: string }>({
      query: ({ courseId, lessonId }) => ({
        url: `/courses/${courseId}/lessons/${lessonId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Lesson',
        'Enrollment',
      ],
    }),
  }),
});

export const {
  useGetCurriculumQuery,
  useListModulesQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useListLessonsQuery,
  useGetLessonQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
} = curriculumApi;

/** Convenience lookup used by the catalog and admin filters. */
export type { Category };
