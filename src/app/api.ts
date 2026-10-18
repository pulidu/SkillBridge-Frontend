import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery, type QueryArgs } from '@/services/apiClient';

/**
 * Every cache tag the app can invalidate. Endpoints declare `providesTags`, so
 * a mutation only refetches the views it actually affects.
 */
export const TAG_TYPES = [
  'Auth',
  'User',
  'Course',
  'Module',
  'Lesson',
  'Quiz',
  'Enrollment',
  'Progress',
  'Submission',
  'Certificate',
  'Notification',
  'Category',
  'Dashboard',
  'AuditLog',
  'StudyTask',
] as const;

export type TagType = (typeof TAG_TYPES)[number];

/**
 * Root RTK Query API. Feature modules call `api.injectEndpoints`, which keeps
 * one cache and one set of tags for the whole application instead of creating a
 * separate store per domain.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: apiBaseQuery,
  tagTypes: [...TAG_TYPES],
  endpoints: () => ({}),
});

/**
 * Cache entry describing a list endpoint's arguments. RTK Query cannot
 * serialise `undefined` reliably across versions, so arguments are normalised
 * to strings and numbers only.
 */
export interface ListCacheKey {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: string;
  status?: string;
  role?: string;
  instructor?: string;
  student?: string;
  course?: string;
  sort?: string;
  unread?: string;
  entity?: string;
  action?: string;
  actor?: string;
}

export const listKey = (prefix: string, args: ListCacheKey = {}): string =>
  `${prefix}(${Object.entries(args)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(',')})`;

export type { QueryArgs };
