import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { CourseStatusBadge, LevelBadge } from '@/components/course/LevelBadge';
import { ProgressBar } from '@/components/course/ProgressBar';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { useGetMyEnrollmentsQuery, useCancelEnrollmentMutation } from '@/features/enrollments/enrollmentsApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { errorMessage, formatDate } from '@/lib/formatters';

type Tab = 'active' | 'completed';

export function MyLearningPage() {
  useDocumentTitle('My learning');

  const [tab, setTab] = useState<Tab>('active');
  const [error, setError] = useState<unknown>(null);

  const { data, isLoading, isError, refetch } = useGetMyEnrollmentsQuery({ limit: 50 });
  const [cancel] = useCancelEnrollmentMutation();

  const enrolments = (data?.items ?? []).filter((item) => item.status === tab);

  const handleCancel = async (id: string) => {
    setError(null);
    try {
      await cancel(id).unwrap();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="My learning"
        subtitle="Courses you are enrolled in and how far you have got."
        action={<LinkButton to="/courses" variant="outline">Browse catalog</LinkButton>}
      />

      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {(['active', 'completed'] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === value ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {value}
            {data ? ` (${(data.items ?? []).filter((item) => item.status === value).length})` : ''}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {errorMessage(error)}
        </p>
      ) : null}

      {isLoading ? <SkeletonCards /> : null}

      {isError ? (
        <EmptyState
          title="Could not load your enrolments"
          description={errorMessage(error)}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      ) : null}

      {!isLoading && enrolments.length === 0 ? (
        <EmptyState
          title={tab === 'active' ? 'You are not enrolled in anything yet' : 'No completed courses yet'}
          description={
            tab === 'active'
              ? 'Find a course in the catalog and enrol to start learning.'
              : 'Finish every lesson in a course to complete it.'
          }
          action={tab === 'active' ? <LinkButton to="/courses">Browse catalog</LinkButton> : undefined}
        />
      ) : null}

      {enrolments.length > 0 ? (
        <ul className="space-y-4">
          {enrolments.map((enrollment) => (
            <li key={enrollment.id}>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={enrollment.course.level} />
                      <CourseStatusBadge status={enrollment.status} />
                    </div>

                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                      <Link
                        to={`/learn/courses/${enrollment.id}`}
                        className="hover:text-brand-700"
                      >
                        {enrollment.course.title}
                      </Link>
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Enrolled {formatDate(enrollment.createdAt)}
                      {enrollment.completedAt ? ` · completed ${formatDate(enrollment.completedAt)}` : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <LinkButton to={`/learn/courses/${enrollment.id}`} size="sm">
                      {tab === 'completed' ? 'Review' : 'Continue'}
                    </LinkButton>
                    {tab === 'active' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleCancel(enrollment.id)}
                      >
                        Leave
                      </Button>
                    ) : null}
                  </div>
                </div>

                <ProgressBar value={enrollment.progress} className="mt-4" label="Progress" />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AppShell>
  );
}
