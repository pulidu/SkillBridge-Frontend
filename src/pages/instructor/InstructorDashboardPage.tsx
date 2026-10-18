import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useGetInstructorDashboardQuery } from '@/features/dashboard/dashboardApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatCompactNumber, formatDuration, formatPercent } from '@/lib/formatters';

export function InstructorDashboardPage() {
  useDocumentTitle('Instructor dashboard');

  const { data, isLoading } = useGetInstructorDashboardQuery();

  const stats = [
    { label: 'Total courses', value: data?.totalCourses ?? 0 },
    { label: 'Published', value: data?.publishedCourses ?? 0 },
    { label: 'Drafts', value: data?.draftCourses ?? 0 },
    { label: 'Total learners', value: formatCompactNumber(data?.totalLearners) },
    { label: 'Avg completion', value: formatPercent(data?.averageCompletion) },
    { label: 'Pending grading', value: data?.pendingSubmissions ?? 0 },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Instructor dashboard"
        subtitle="How your courses are performing."
        action={
          <Link
            to="/instructor/courses/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            New course
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Top courses"
            action={
              <Link to="/instructor/courses" className="text-xs font-medium text-brand-600">
                View all
              </Link>
            }
          />
          <CardBody className="p-0">
            {isLoading ? <SkeletonRows rows={4} columns={2} /> : null}

            {!isLoading && (data?.topCourses.length ?? 0) === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                You have not created any courses yet.
              </p>
            ) : null}

            {data && data.topCourses.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {data.topCourses.map((course) => (
                  <li key={course.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{course.title}</p>
                      <p className="text-xs text-slate-500">
                        {course.enrollmentCount} learners · {formatDuration(course.durationMinutes)}
                      </p>
                    </div>
                    <Link
                      to={`/instructor/courses/${course.id}/curriculum`}
                      className="shrink-0 text-xs font-medium text-brand-600"
                    >
                      Manage
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Ratings" subtitle="Across every course you own." />
          <CardBody>
            <p className="stat-value">
              {data && data.averageRating > 0 ? data.averageRating.toFixed(2) : '—'}
            </p>
            <p className="mt-1 text-sm text-slate-500">Average star rating</p>
            <Link
              to="/instructor/courses"
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Review your courses
            </Link>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
