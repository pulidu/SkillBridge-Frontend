import { api, listKey } from '@/app/api';
import { toPaginated } from '@/services/apiClient';
import type { Paginated, Submission, SubmissionStatus } from '@/types';

export interface CreateSubmissionRequest {
  course: string;
  lesson: string;
  content: string;
  attachments?: Array<{ name: string; url: string; size: number; mimeType?: string }>;
}

export interface ListSubmissionsParams {
  page?: number;
  limit?: number;
  course?: string;
  student?: string;
  status?: SubmissionStatus;
}

export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
  status?: 'graded' | 'returned';
}

export const submissionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMySubmissions: builder.query<Paginated<Submission>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/submissions/me', params: { ...params } }),
      transformResponse: (response: Submission[], meta) => toPaginated(response, meta),
      providesTags: (result) => ['Submission', ...(result ? [{ type: 'Submission' as const, id: 'MINE' }] : [])],
    }),

    createSubmission: builder.mutation<Submission, CreateSubmissionRequest>({
      query: (body) => ({ url: '/submissions', method: 'POST', body }),
      invalidatesTags: ['Submission', 'Dashboard'],
    }),

    listSubmissions: builder.query<Paginated<Submission>, ListSubmissionsParams | void>({
      query: (params) => ({ url: '/submissions', params: { ...params } }),
      transformResponse: (response: Submission[], meta) => toPaginated(response, meta),
      providesTags: (result, _error, params) => [
        ...(result
          ? result.items.map(({ id }) => ({ type: 'Submission' as const, id }))
          : [{ type: 'Submission' as const, id: listKey('ALL', params ?? {}) }]),
        'Submission',
      ],
    }),

    gradeSubmission: builder.mutation<Submission, { id: string; body: GradeSubmissionRequest }>({
      query: ({ id, body }) => ({ url: `/submissions/${id}/grade`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Submission', id },
        'Submission',
        'Dashboard',
      ],
    }),
  }),
});

export const {
  useGetMySubmissionsQuery,
  useCreateSubmissionMutation,
  useListSubmissionsQuery,
  useGradeSubmissionMutation,
} = submissionsApi;
