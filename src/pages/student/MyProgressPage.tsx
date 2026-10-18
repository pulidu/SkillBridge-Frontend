import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgressBar } from '@/components/course/ProgressBar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useGetMyProgressQuery } from '@/features/progress/progressApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDuration, formatPercent } from '@/lib/formatters';

export function MyProgressPage() {
  useDocumentTitle('My progress');

  const { data, isLoading } = useGetMyProgressQuery();

  const stats = [
    { label: 'Enrolled courses', value: data?.totalEnrollments ?? 0 },
    { label: 'Completed', value: data?.completedEnrollments ?? 0 },
    { label: 'Average progress', value: formatPercent(data?.averageProgress) },
    { label: 'Time spent', value: formatDuration(data?.totalTimeSpentMinutes) },
    { label: 'Certificates', value: data?.certificatesEarned ?? 0 },
  ];

  return (
    <AppShell>
      <PageHeader title="My progress" subtitle="How far you have got across every course." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Per-course progress" />
        <CardBody className="p-0">
          {isLoading ? <SkeletonRows rows={4} columns={2} /> : null}

          {!isLoading && (data?.items.length ?? 0) === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No enrolments yet"
                description="Enrol in a course to start tracking progress."
              />
            </div>
          ) : null}

          {(data?.items.length ?? 0) > 0 ? (
            <ul className="divide-y divide-slate-100">
              {data?.items.map((item) => (
                <li key={item.id} className="px-5 py-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="truncate text-sm font-medium text-slate-900">{item.course.title}</p>
                    <p className="shrink-0 text-xs text-slate-500">
                      {(item.completedLessons ?? []).length} lessons ·{' '}
                      {formatDuration(item.timeSpentMinutes)}
                    </p>
                  </div>
                  <ProgressBar value={item.progress} />
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>
    </AppShell>
  );
}
