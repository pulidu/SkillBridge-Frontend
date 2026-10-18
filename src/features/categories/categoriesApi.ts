import { api } from '@/app/api';
import type { Category } from '@/types';

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  slug?: string;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

/** A category plus the number of published courses filed under it. */
export interface CategoryWithCount extends Category {
  courseCount: number;
}

export const categoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query<Category[], void>({
      query: () => ({ url: '/categories' }),
      transformResponse: (response: Category[]) => response ?? [],
      providesTags: ['Category'],
    }),

    listCategoriesWithCounts: builder.query<CategoryWithCount[], void>({
      query: () => ({ url: '/categories/counts' }),
      transformResponse: (response: CategoryWithCount[]) => response ?? [],
      providesTags: ['Category'],
    }),

    getCategory: builder.query<Category, string>({
      query: (id) => ({ url: `/categories/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),

    createCategory: builder.mutation<Category, CreateCategoryRequest>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category', 'Course'],
    }),

    updateCategory: builder.mutation<Category, { id: string; body: UpdateCategoryRequest }>({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Category', id }, 'Category', 'Course'],
    }),

    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category', 'Course'],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useListCategoriesWithCountsQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
