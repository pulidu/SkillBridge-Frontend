import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { statusTone } from '@/components/ui/statusTone';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/course/ProgressBar';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import { useGetCourseStudentsQuery } from '@/features/courses/coursesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatPercent, nameOf } from '@/lib/formatters';
import type { EnrollmentDetail } from '@/types';

/** The API may return a bare student id, so only read email when populated. */
const emailOf = (student: EnrollmentDetail['student']): string =>
  typeof student === 'string' ? '' : student.email;

export function RosterPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  useDocumentTitle('Course roster');

  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetCourseStudentsQuery(
    { id: courseId, page, limit: 20 },
    { skip: !courseId },
  );

  const columns: Array<Column<EnrollmentDetail>> = [
    {
      key: 'student',
      header: 'Learner',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{nameOf(row.student)}</p>
          <p className="truncate text-xs text-slate-500">{emailOf(row.student)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => (
        <div className="min-w-[8rem]">
          <ProgressBar value={row.progress} className="mb-1" />
          <p className="text-xs text-slate-500">{formatPercent(row.progress)}</p>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Time spent',
      render: (row) => `${row.timeSpentMinutes} min`,
      hideBelow: 'md',
    },
    {
      key: 'score',
      header: 'Score',
      render: (row) => (row.finalScore === undefined ? '—' : formatPercent(row.finalScore)),
      hideBelow: 'lg',
    },
    {
      key: 'lastSeen',
      header: 'Last active',
      render: (row) => formatDate(row.lastAccessedAt ?? row.createdAt),
      hideBelow: 'md',
    },
  ];

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/instructor" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/instructor/courses" className="hover:text-brand-700">
          My courses
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Learner roster</span>
      </nav>

      <PageHeader
        title="Learner roster"
        subtitle={`${data?.meta.total ?? 0} enrolled`}
        action={
          <Link
            to="/instructor/courses"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to courses
          </Link>
        }
      />

      {isLoading ? <SkeletonRows rows={8} columns={5} /> : null}

      {isError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Could not load the roster.
        </p>
      ) : null}

      {data ? <DataTable<EnrollmentDetail> columns={columns} rows={data.items} rowKey={(row) => row.id} caption="Learners enrolled in this course" emptyMessage="Nobody has enrolled yet." /> : null}

      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader title="How completion is tracked" />
        <CardBody>
          <p className="text-sm text-slate-500">
            Progress is derived from lesson completion records. A learner reaches 100% once every
            published lesson in the course has been marked complete, which is also the point at which
            a certificate is issued.
          </p>
        </CardBody>
      </Card>
    </AppShell>
  );
}