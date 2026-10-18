import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { statusTone } from '@/components/ui/statusTone';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useGetMySubmissionsQuery } from '@/features/submissions/submissionsApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDateTime } from '@/lib/formatters';

export function MySubmissionsPage() {
  useDocumentTitle('My submissions');

  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMySubmissionsQuery({ page, limit: 20 });

  return (
    <AppShell>
      <PageHeader title="My submissions" subtitle="Assignment work you have handed in." />

      {isLoading ? <SkeletonRows rows={4} columns={3} /> : null}

      {!isLoading && (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Assignment lessons collect your work and show it here."
        />
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <ul className="space-y-3">
            {data.items.map((submission) => (
              <li key={submission.id}>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {submission.assignmentTitle}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {typeof submission.course === 'string'
                          ? submission.course
                          : submission.course.title}{' '}
                        · submitted {formatDateTime(submission.createdAt)}
                      </p>
                    </div>

                    <Badge tone={statusTone(submission.status)}>{submission.status}</Badge>
                  </div>

                  {submission.content ? (
                    <p className="prose-body mt-3 border-t border-slate-100 pt-3">
                      {submission.content}
                    </p>
                  ) : null}

                  {submission.status === 'graded' || submission.status === 'returned' ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Grade: {submission.grade ?? '—'}
                      </p>
                      {submission.feedback ? (
                        <p className="mt-1 text-sm text-slate-700">{submission.feedback}</p>
                      ) : null}
                      {submission.gradedAt ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Graded {formatDateTime(submission.gradedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
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
