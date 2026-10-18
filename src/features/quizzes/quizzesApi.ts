import { api } from '@/app/api';
import { toPaginated } from '@/services/apiClient';
import type { Paginated, QuestionType, Quiz, QuizAttempt, QuizOption } from '@/types';

export interface QuizQuestionInput {
  text: string;
  type?: QuestionType;
  options?: Array<{ text: string; isCorrect?: boolean }>;
  correctAnswer?: string;
  points?: number;
  explanation?: string;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  lesson?: string;
  questions: QuizQuestionInput[];
  passingScore?: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  isPublished?: boolean;
}

export type UpdateQuizRequest = Partial<CreateQuizRequest>;

export interface SubmitAttemptRequest {
  answers: Array<{
    question: string;
    selectedOptionIds?: string[];
    textAnswer?: string;
  }>;
  timeSpentSeconds?: number;
}

export const quizzesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCourseQuizzes: builder.query<Quiz[], string>({
      query: (courseId) => ({ url: `/courses/${courseId}/quizzes` }),
      transformResponse: (response: Quiz[]) => response ?? [],
      providesTags: (_result, _error, courseId) => [
        { type: 'Course', id: courseId },
        'Quiz',
      ],
    }),

    createQuiz: builder.mutation<Quiz, { courseId: string; body: CreateQuizRequest }>({
      query: ({ courseId, body }) => ({ url: `/courses/${courseId}/quizzes`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        'Quiz',
      ],
    }),

    getQuiz: builder.query<Quiz, string>({
      query: (id) => ({ url: `/quizzes/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Quiz', id }],
    }),

    updateQuiz: builder.mutation<Quiz, { id: string; body: UpdateQuizRequest }>({
      query: ({ id, body }) => ({ url: `/quizzes/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Quiz', id }, 'Quiz'],
    }),

    deleteQuiz: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/quizzes/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Quiz', id }, 'Quiz'],
    }),

    /**
     * Submits an attempt. Grading happens entirely server side: the correct
     * options are stripped from every student-facing quiz payload, so answers
     * cannot be read out of the network response.
     */
    submitAttempt: builder.mutation<QuizAttempt, { id: string; body: SubmitAttemptRequest }>({
      query: ({ id, body }) => ({ url: `/quizzes/${id}/attempts`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quiz', id },
        'Enrollment',
        'Progress',
        'Dashboard',
      ],
    }),

    getMyAttempts: builder.query<QuizAttempt[], string>({
      query: (id) => ({ url: `/quizzes/${id}/attempts/me` }),
      transformResponse: (response: QuizAttempt[]) => response ?? [],
      providesTags: (_result, _error, id) => [{ type: 'Quiz', id }],
    }),

    getAllAttempts: builder.query<Paginated<QuizAttempt>, { id: string; page?: number; limit?: number }>({
      query: ({ id, ...params }) => ({ url: `/quizzes/${id}/attempts`, params }),
      transformResponse: (response: QuizAttempt[], meta) => toPaginated(response, meta),
      providesTags: (_result, _error, { id }) => [{ type: 'Quiz', id }],
    }),
  }),
});

export const {
  useListCourseQuizzesQuery,
  useCreateQuizMutation,
  useGetQuizQuery,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useSubmitAttemptMutation,
  useGetMyAttemptsQuery,
  useGetAllAttemptsQuery,
} = quizzesApi;

export type { QuizOption };
