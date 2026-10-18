import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { CourseLevel, CourseSort, CourseStatus } from '@/types';

export interface CourseFilters {
  search: string;
  category: string;
  level: CourseLevel | '';
  status: CourseStatus | '';
  sort: CourseSort;
  page: number;
  limit: number;
}

const initialState: CourseFilters = {
  search: '',
  category: '',
  level: '',
  status: '',
  sort: 'newest',
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
};

/**
 * Catalog filters live in Redux rather than in component state because they
 * must survive navigation between the catalog, a category page and a course
 * detail page, and they are written straight into the query parameters.
 */
export const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload;
      state.page = 1;
    },
    setLevel(state, action: PayloadAction<CourseLevel | ''>) {
      state.level = action.payload;
      state.page = 1;
    },
    setStatus(state, action: PayloadAction<CourseStatus | ''>) {
      state.status = action.payload;
      state.page = 1;
    },
    setSort(state, action: PayloadAction<CourseSort>) {
      state.sort = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setLimit(state, action: PayloadAction<number>) {
      state.limit = action.payload;
      state.page = 1;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const {
  setSearch,
  setCategory,
  setLevel,
  setStatus,
  setSort,
  setPage,
  setLimit,
  resetFilters,
} = coursesSlice.actions;

export const coursesReducer = coursesSlice.reducer;

type RootStateWithCourses = { courses: CourseFilters };

export const selectCourseFilters = (state: RootStateWithCourses): CourseFilters => state.courses;
