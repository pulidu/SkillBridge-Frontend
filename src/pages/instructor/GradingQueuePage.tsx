import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FieldErrorList } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { statusTone } from '@/components/ui/statusTone';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  useGradeSubmissionMutation,
  useListSubmissionsQuery,
} from '@/features/submissions/submissionsApi';
import { useListCoursesQuery } from '@/features/courses/coursesApi';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/authSlice';
import { apiErrorMessage, apiErrors, formatDateTime, nameOf } from '@/lib/formatters';
import type { Submission } from '@/types';

const titleOf = (course: Submission['course']): string =>
  typeof course === 'string' ? course : course.title;

export function GradingQueuePage() {
  useDocumentTitle('Grading queue');

  const user = useAppSelector(selectUser);
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState<'submitted' | 'graded' | 'returned' | ''>('submitted');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<Submission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<unknown>(null);

  const { data: mine } = useListCoursesQuery(
    { instructor: user?.id, limit: 100, sort: 'newest' },
    { skip: !user?.id },
  );

  const { data, isLoading, isError } = useListSubmissionsQuery({
    page,
    limit: 20,
    course: courseId || undefined,
    status: status || undefined,
  });

  const [gradeSubmission, { isLoading: isGrading }] = useGradeSubmissionMutation();

  const openGrading = (submission: Submission) => {
    setActive(submission);
    setGrade(submission.grade === undefined ? '' : String(submission.grade));
    setFeedback(submission.feedback ?? '');
    setError(null);
  };

  const submitGrade = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active) return;

    setError(null);
    try {
      await gradeSubmission({
        id: active.id,
        body: { grade: Number(grade) || 0, feedback: feedback.trim() || undefined },
      }).unwrap();
      setActive(null);
    } catch (err) {
      setError(err);
    }
  };

  const columns: Array<Column<Submission>> = [
    {
      key: 'student',
      header: 'Learner',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{nameOf(row.student)}</p>
          <p className="truncate text-xs text-slate-500">{row.assignmentTitle}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      render: (row) => titleOf(row.course),
      hideBelow: 'md',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (row) => (row.grade === undefined ? '—' : row.grade),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (row) => formatDateTime(row.createdAt),
      hideBelow: 'lg',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => openGrading(row)}>
          Grade
        </Button>
      ),
    },
  ];

  return (
    <AppShell variant="fullWidth">
      <PageHeader
        title="Grading queue"
        subtitle="Assignment submissions waiting for your feedback."
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Select
          label="Course"
          value={courseId}
          placeholder="All of my courses"
          onChange={(event) => {
            setCourseId(event.target.value);
            setPage(1);
          }}
          options={(mine?.items ?? []).map((course) => ({ value: course.id, label: course.title }))}
        />

        <Select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
          placeholder="Any status"
          options={[
            { value: 'submitted', label: 'Awaiting grading' },
            { value: 'graded', label: 'Graded' },
            { value: 'returned', label: 'Returned' },
          ]}
        />
      </div>

      {isLoading ? <SkeletonRows rows={8} columns={5} /> : null}

      {isError ? (
        <EmptyState title="Could not load submissions" description="Please try again." />
      ) : null}

      {!isLoading && (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="Nothing to grade"
          description="When learners submit assignments they will appear here."
        />
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <DataTable<Submission>
            columns={columns}
            rows={data.items}
            rowKey={(row) => row.id}
            caption="Assignment submissions"
          />
          <div className="mt-4">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        </>
      ) : null}

      <Modal
        isOpen={active !== null}
        title="Grade submission"
        onClose={() => setActive(null)}
        footer={
          <Button type="submit" form="grade-form" isLoading={isGrading}>
            Save grade
          </Button>
        }
      >
        <form id="grade-form" onSubmit={submitGrade} className="space-y-4">
          {error ? (
            <div className="space-y-2">
              <FieldErrorList errors={apiErrors(error)} />
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {apiErrorMessage(error)}
              </p>
            </div>
          ) : null}

          {active ? (
            <Card>
              <CardHeader title={active.assignmentTitle} subtitle={`Course: ${titleOf(active.course)}`} />
              <CardBody className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-medium">Learner:</span> {nameOf(active.student)}
                </p>
                <p>
                  <span className="font-medium">Submitted:</span> {formatDateTime(active.createdAt)}
                </p>
                {active.dueAt ? (
                  <p>
                    <span className="font-medium">Due:</span> {formatDateTime(active.dueAt)}
                  </p>
                ) : null}

                {active.content ? (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Submission
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{active.content}</p>
                  </div>
                ) : null}

                {active.attachments.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attachments
                    </p>
                    <ul className="mt-1 space-y-1">
                      {active.attachments.map((attachment) => (
                        <li key={attachment.url}>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 hover:underline"
                          >
                            {attachment.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          <Input
            label="Grade out of 100"
            type="number"
            min={0}
            max={100}
            required
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
          />

          <Textarea
            label="Feedback"
            rows={4}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            hint="The learner sees this in their submissions list."
          />
        </form>
      </Modal>
    </AppShell>
  );
}