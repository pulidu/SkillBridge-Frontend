import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { CourseStatusBadge, LevelBadge } from '@/components/course/LevelBadge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import {
  useArchiveCourseMutation,
  useDeleteCourseMutation,
  useListCoursesQuery,
  usePublishCourseMutation,
  useUnpublishCourseMutation,
} from '@/features/courses/coursesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatPercent, formatPrice, nameOf } from '@/lib/formatters';
import type { Course, CourseLevel, CourseStatus } from '@/types';

export function AdminCourseListPage() {
  useDocumentTitle('Course administration');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CourseStatus | ''>('');
  const [level, setLevel] = useState<CourseLevel | ''>('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);
  const [error, setError] = useState<unknown>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useListCoursesQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status || undefined,
    level: level || undefined,
    sort: 'newest',
  });

  const [publish] = usePublishCourseMutation();
  const [unpublish] = useUnpublishCourseMutation();
  const [archive] = useArchiveCourseMutation();
  const [remove] = useDeleteCourseMutation();

  const run = (action: () => Promise<unknown>) => {
    setError(null);
    action().catch(setError);
  };

  const columns: Array<Column<Course>> = [
    {
      key: 'title',
      header: 'Course',
      render: (row) => (
        <div className="min-w-0">
          <Link
            to={`/courses/${row.slug}`}
            className="truncate font-medium text-slate-900 hover:text-brand-600"
          >
            {row.title}
          </Link>
          <p className="truncate text-xs text-slate-500">{nameOf(row.instructor)}</p>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      render: (row) => <LevelBadge level={row.level} />,
      hideBelow: 'md',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <CourseStatusBadge status={row.status} />,
    },
    {
      key: 'enrollments',
      header: 'Learners',
      render: (row) => row.enrollmentCount,
    },
    {
      key: 'price',
      header: 'Price',
      render: (row) => formatPrice(row.price, row.currency),
      hideBelow: 'md',
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => formatPercent(row.averageRating),
      hideBelow: 'lg',
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (row) => formatDate(row.updatedAt ?? row.createdAt),
      hideBelow: 'lg',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-1">
          {row.status === 'published' ? (
            <Button size="sm" variant="ghost" onClick={() => run(() => unpublish(row.id).unwrap())}>
              Unpublish
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => run(() => publish(row.id).unwrap())}>
              Publish
            </Button>
          )}

          {row.status !== 'archived' ? (
            <Button size="sm" variant="ghost" onClick={() => run(() => archive(row.id).unwrap())}>
              Archive
            </Button>
          ) : null}

          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">All courses</span>
      </nav>

      <PageHeader
        title="Course administration"
        subtitle={`${data?.meta.total ?? 0} courses across every instructor`}
        action={
          <Link
            to="/admin"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to dashboard
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
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
          placeholder="Any status"
          onChange={(event) => {
            setStatus(event.target.value as CourseStatus | '');
            setPage(1);
          }}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' },
          ]}
        />

        <Select
          label="Level"
          value={level}
          placeholder="Any level"
          onChange={(event) => {
            setLevel(event.target.value as CourseLevel | '');
            setPage(1);
          }}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error instanceof Error ? error.message : 'That action could not be completed.'}
        </p>
      ) : null}

      {isLoading ? <SkeletonRows rows={10} columns={6} /> : null}

      {isError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Could not load courses.
        </p>
      ) : null}

      {data ? (
        <DataTable<Course> columns={columns} rows={data.items} rowKey={(row) => row.id} caption="All courses" />
      ) : null}

      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader title="Moderation notes" />
        <CardBody>
          <p className="text-sm text-slate-500">
            Publishing makes a course visible in the public catalog immediately. Archiving keeps the
            record and its learner history intact but removes it from search. Hard deletion is only
            permitted when the course has no enrollments.
          </p>
        </CardBody>
      </Card>

      <Modal
        isOpen={confirmDelete !== null}
        title="Delete course"
        size="sm"
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const target = confirmDelete;
                if (!target) return;
                remove(target.id)
                  .unwrap()
                  .then(() => setConfirmDelete(null))
                  .catch(setError);
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          <strong>{confirmDelete?.title}</strong> will be permanently removed along with{' '}
          {confirmDelete?.totalLessons ?? 0} lesson(s). If learners are still enrolled the API will
          refuse the deletion.
        </p>
      </Modal>
    </AppShell>
  );
}