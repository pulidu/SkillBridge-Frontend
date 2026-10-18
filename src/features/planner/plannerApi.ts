import { api } from '@/app/api';
import type {
  AdminPlannerStats,
  InstructorPlannerStats,
  StudentPlannerStats,
  StudyTask,
  StudyTaskPriority,
  StudyTaskStatus,
  WeeklySchedule,
} from '@/types';

export interface ListStudyTasksParams {
  [key: string]: string | number | boolean | null | undefined;
  status?: StudyTaskStatus | '';
  priority?: StudyTaskPriority | '';
  courseId?: string;
  from?: string;
  to?: string;
}

export interface CreateStudyTaskRequest {
  title: string;
  description?: string;
  courseId?: string;
  assignmentId?: string;
  dueDate: string;
  estimatedStudyMinutes?: number;
  priority?: StudyTaskPriority;
}

export interface UpdateStudyTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  estimatedStudyMinutes?: number;
  priority?: StudyTaskPriority;
  status?: StudyTaskStatus;
}

export const plannerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listTasks: builder.query<StudyTask[], ListStudyTasksParams | void>({
      query: (params) => ({
        url: '/planner/tasks',
        params: params ? { ...params } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'StudyTask' as const, id })),
              { type: 'StudyTask', id: 'LIST' },
            ]
          : [{ type: 'StudyTask', id: 'LIST' }],
    }),

    getTask: builder.query<StudyTask, string>({
      query: (id) => ({ url: `/planner/tasks/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'StudyTask', id }],
    }),

    createTask: builder.mutation<StudyTask, CreateStudyTaskRequest>({
      query: (body) => ({
        url: '/planner/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'StudyTask', id: 'LIST' }, 'Dashboard'],
    }),

    updateTask: builder.mutation<StudyTask, { id: string; body: UpdateStudyTaskRequest }>({
      query: ({ id, body }) => ({
        url: `/planner/tasks/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'StudyTask', id },
        { type: 'StudyTask', id: 'LIST' },
        'Dashboard',
      ],
    }),

    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/planner/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'StudyTask', id },
        { type: 'StudyTask', id: 'LIST' },
        'Dashboard',
      ],
    }),

    generateSuggestions: builder.mutation<{ createdCount: number; message: string }, void>({
      query: () => ({
        url: '/planner/suggestions',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'StudyTask', id: 'LIST' }, 'Dashboard'],
    }),

    getWeeklySchedule: builder.query<WeeklySchedule, string | void>({
      query: (weekStart) => ({
        url: '/planner/weekly',
        params: weekStart ? { weekStart } : undefined,
      }),
      providesTags: [{ type: 'StudyTask', id: 'WEEKLY' }],
    }),

    getStudentPlannerStats: builder.query<StudentPlannerStats, void>({
      query: () => ({ url: '/planner/stats' }),
      providesTags: [{ type: 'StudyTask', id: 'STATS' }],
    }),

    getAdminPlannerStats: builder.query<AdminPlannerStats, void>({
      query: () => ({ url: '/planner/admin/analytics' }),
      providesTags: ['Dashboard'],
    }),

    getInstructorPlannerStats: builder.query<InstructorPlannerStats, void>({
      query: () => ({ url: '/planner/instructor/analytics' }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useListTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGenerateSuggestionsMutation,
  useGetWeeklyScheduleQuery,
  useGetStudentPlannerStatsQuery,
  useGetAdminPlannerStatsQuery,
  useGetInstructorPlannerStatsQuery,
} = plannerApi;
