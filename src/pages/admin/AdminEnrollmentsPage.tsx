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
import { formatDate } from '@/lib/formatters';
import { useListEnrollmentsQuery } from '@/features/enrollments/enrollmentsApi';
import type { Enrollment, EnrollmentStatus } from '@/types';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdminEnrollmentsPage() {
  useDocumentTitle('Enrollments');
  const [course, setCourse] = useState('');
  const [student, setStudent] = useState('');
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');
  const [page, setPage] = useState(1);

  const debouncedCourse = useDebounce(course);
  const debouncedStudent = useDebounce(student);

  const { data, isLoading, isError } = useListEnrollmentsQuery({
    page,
    limit: 20,
    course: debouncedCourse || undefined,
    student: debouncedStudent || undefined,
    status: status || undefined,
  });

  const courseNameOf = (courseValue: Enrollment['course']): string => {
    if (!courseValue) return 'Unknown';
    return typeof courseValue === 'string' ? courseValue : courseValue.title;
  };

  const studentNameOf = (studentValue: Enrollment['student']): string => {
    if (!studentValue) return 'Unknown';
    return typeof studentValue === 'string' ? studentValue : studentValue.fullName;
  };

  const columns: Array<Column<Enrollment>> = [
    { key: 'course', header: 'Course', render: (row) => courseNameOf(row.course) },
    { key: 'student', header: 'Student', render: (row) => studentNameOf(row.student) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'active' ? 'success' : row.status === 'completed' ? 'info' : 'neutral'}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'progress', header: 'Progress', render: (row) => `${row.progress ?? 0}%` },
    { key: 'date', header: 'Enrolled', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <AppShell variant="fullWidth">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin" className="hover:text-brand-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Enrollments</span>
      </nav>

      <PageHeader
        title="Enrollments"
        subtitle="View all enrollments across the platform"
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
          <Input
            label="Student ID"
            value={student}
            onChange={(e) => {
              setStudent(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(e) => {
              setStatus(e.target.value as EnrollmentStatus | '');
              setPage(1);
            }}
          />
        </CardBody>
      </Card>

      {isLoading ? <SkeletonRows rows={8} columns={5} /> : null}

      {isError ? <p className="mb-4 text-sm text-rose-600">Failed to load enrollments.</p> : null}

      {data ? (
        <Card>
          <DataTable<Enrollment>
            columns={columns}
            rows={data.items}
            rowKey={(row) => row.id}
            caption="All enrollments"
            emptyMessage="No enrollments found"
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
