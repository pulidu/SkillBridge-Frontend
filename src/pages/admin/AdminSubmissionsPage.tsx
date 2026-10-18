import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, nameOf } from '@/lib/formatters';
import { useListSubmissionsQuery } from '@/features/submissions/submissionsApi';
import type { Submission, SubmissionStatus } from '@/types';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'graded', label: 'Graded' },
  { value: 'returned', label: 'Returned' },
];

export function AdminSubmissionsPage() {
  useDocumentTitle('Submissions');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState<SubmissionStatus | ''>('');
  const [page, setPage] = useState(1);

  const debouncedCourse = useDebounce(course);

  const { data, isLoading, isError } = useListSubmissionsQuery({
    page,
    limit: 20,
    course: debouncedCourse || undefined,
    status: status || undefined,
  });

  const columns: Array<Column<Submission>> = [
    { key: 'course', header: 'Course', render: (row: any) => nameOf(row.course) },
    { key: 'student', header: 'Student', render: (row: any) => nameOf(row.student) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'submitted' ? 'warning' : 'success'}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'grade', header: 'Grade', render: (row: any) => (row.grade !== undefined ? `${row.grade}` : '-') },
    { key: 'date', header: 'Submitted', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Submissions</span>
      </nav>

      <PageHeader
        title="Submissions"
        subtitle="View all submissions across the platform"
        action={
          <Link
            to="/admin"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to dashboard
          </Link>
        }
      />
      <Card className="mb-6">
        <CardHeader title="Filters" />
        <CardBody className="grid gap-4 sm:grid-cols-4">
          <Input
            label="Course ID"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(e) => {
              setStatus(e.target.value as SubmissionStatus | '');
              setPage(1);
            }}
          />
        </CardBody>
      </Card>

      {isLoading ? <SkeletonRows rows={8} columns={5} /> : null}

      {isError ? <p className="mb-4 text-sm text-rose-600">Failed to load submissions.</p> : null}

      {data ? (
        <Card>
          <DataTable<Submission>
            columns={columns}
            rows={data.items}
            rowKey={(row) => row.id}
            caption="All submissions"
            emptyMessage="No submissions found"
          />
          {data.meta && data.meta.totalPages > 1 ? (
            <CardBody className="flex justify-end">
              <Pagination meta={data.meta} onPageChange={setPage} />
            </CardBody>
          ) : null}
        </Card>
      ) : null}
    </AppShell>
  );
}
