import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/course/ProgressBar';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useGetAdminDashboardQuery } from '@/features/dashboard/dashboardApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatCompactNumber, formatPrice } from '@/lib/formatters';

  const QUICK_LINKS = [
    { to: '/admin/users', label: 'Manage users' },
    { to: '/admin/courses', label: 'Manage courses' },
    { to: '/admin/enrollments', label: 'Enrollments' },
    { to: '/admin/submissions', label: 'Submissions' },
    { to: '/admin/categories', label: 'Manage categories' },
    { to: '/admin/audit-logs', label: 'Audit logs' },
  ];

export function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard');

  const { data, isLoading } = useGetAdminDashboardQuery();

  const stats = [
    { label: 'Users', value: formatCompactNumber(data?.totalUsers) },
    { label: 'Active students', value: formatCompactNumber(data?.totalActiveStudents ?? data?.students) },
    { label: 'Instructors', value: formatCompactNumber(data?.instructors) },
    { label: 'Active instructors', value: formatCompactNumber(data?.totalActiveInstructors ?? data?.instructors) },
    { label: 'Courses', value: formatCompactNumber(data?.totalCourses) },
    { label: 'Published', value: formatCompactNumber(data?.publishedCourses) },
    { label: 'Enrollments', value: formatCompactNumber(data?.totalEnrollments) },
    { label: 'Certificates', value: formatCompactNumber(data?.certificatesIssued) },
    { label: 'Pending submissions', value: formatCompactNumber(data?.pendingSubmissions ?? 0) },
  ];

  return (
    <AppShell variant="fullWidth">
      <PageHeader
        title="Admin dashboard"
        subtitle="Platform-wide health at a glance."
        action={
          <nav className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Role breakdown" />
          <CardBody className="space-y-4">
            {isLoading ? <SkeletonRows rows={3} columns={2} /> : null}

            {data?.roleBreakdown.map((entry) => {
              const share =
                data.totalUsers > 0 ? Math.round((entry.count / data.totalUsers) * 100) : 0;

              return (
                <div key={entry.role}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-700">{entry.role}</span>
                    <span className="text-slate-500">
                      {entry.count} ({share}%)
                    </span>
                  </div>
                  <ProgressBar value={share} />
                </div>
              );
            })}

            {data && data.roleBreakdown.length === 0 ? (
              <p className="text-sm text-slate-500">No accounts yet.</p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Growth" />
          <CardBody className="space-y-3">
            <div>
              <p className="stat-label">Sign-ups (30 days)</p>
              <p className="stat-value">{formatCompactNumber(data?.signupsLast30Days)}</p>
            </div>
            <div>
              <p className="stat-label">Paid course value</p>
              <p className="stat-value">{formatPrice(data?.revenueProxy)}</p>
              <p className="mt-1 text-xs text-slate-500">
                Sum of listed prices across published courses, used as a proxy because this
                coursework build does not process payments.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Top courses"
            action={
              <Link to="/admin/courses" className="text-xs font-medium text-brand-600">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {isLoading ? <SkeletonRows rows={4} columns={2} /> : null}

            {data?.topCourses.map((course, index) => (
              <div key={course.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">{index + 1}</span>
                  <p className="truncate text-sm text-slate-700">{course.title}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{course.enrollmentCount}</span>
              </div>
            ))}

            {data && data.topCourses.length === 0 ? (
              <p className="text-sm text-slate-500">No courses yet.</p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}