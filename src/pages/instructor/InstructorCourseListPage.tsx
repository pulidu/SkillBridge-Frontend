import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { CourseStatusBadge, LevelBadge } from '@/components/course/LevelBadge';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/authSlice';
import {
  useArchiveCourseMutation,
  useListCoursesQuery,
  usePublishCourseMutation,
  useUnpublishCourseMutation,
} from '@/features/courses/coursesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDuration, formatPercent } from '@/lib/formatters';
import type { CourseStatus } from '@/types';

export function InstructorCourseListPage() {
  useDocumentTitle('My courses');

  const user = useAppSelector(selectUser);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CourseStatus | ''>('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<unknown>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useListCoursesQuery(
    {
      page,
      limit: 12,
      instructor: user?.id,
      search: debouncedSearch || undefined,
      status: status || undefined,
      sort: 'newest',
    },
    { skip: !user?.id },
  );

  const [publish] = usePublishCourseMutation();
  const [unpublish] = useUnpublishCourseMutation();
  const [archive] = useArchiveCourseMutation();

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <AppShell variant="fullWidth">
      <PageHeader
        title="My courses"
        subtitle="Everything you author, from draft to archived."
        action={<LinkButton to="/instructor/courses/new">New course</LinkButton>}
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Input
          label="Search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as CourseStatus | '');
            setPage(1);
          }}
          placeholder="All statuses"
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error instanceof Error ? error.message : 'That action could not be completed.'}
        </p>
      ) : null}

      {isLoading ? <SkeletonRows rows={5} columns={5} /> : null}

      {isError ? (
        <EmptyState title="Could not load your courses" description="Please try again." />
      ) : null}

      {!isLoading && (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to start building a curriculum."
          action={<LinkButton to="/instructor/courses/new">Create a course</LinkButton>}
        />
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <ul className="space-y-3">
            {data.items.map((course) => (
              <li key={course.id}>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <LevelBadge level={course.level} />
                        <CourseStatusBadge status={course.status} />
                      </div>

                      <h3 className="mt-2 text-base font-semibold text-slate-900">{course.title}</h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {course.totalLessons} lessons · {formatDuration(course.durationMinutes)} ·{' '}
                        {course.enrollmentCount} learners · {formatPercent(course.averageRating)} rating
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <LinkButton to={`/instructor/courses/${course.id}/edit`} size="sm" variant="outline">
                        Edit
                      </LinkButton>
                      <LinkButton
                        to={`/instructor/courses/${course.id}/curriculum`}
                        size="sm"
                        variant="outline"
                      >
                        Curriculum
                      </LinkButton>
                      <LinkButton
                        to={`/instructor/courses/${course.id}/students`}
                        size="sm"
                        variant="ghost"
                      >
                        Roster
                      </LinkButton>

                      {course.status === 'published' ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void run(() => unpublish(course.id).unwrap())}
                          >
                            Unpublish
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void run(() => archive(course.id).unwrap())}
                          >
                            Archive
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => void run(() => publish(course.id).unwrap())}
                        >
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      ) : null}
    </AppShell>
  );
}
