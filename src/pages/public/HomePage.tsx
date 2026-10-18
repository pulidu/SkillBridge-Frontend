import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CourseCard } from '@/components/course/CourseCard';
import { LinkButton } from '@/components/ui/Button';
import { useListFeaturedCoursesQuery } from '@/features/courses/coursesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';

const FEATURES = [
  {
    title: 'Author with structure',
    body: 'Group lessons into modules, attach videos and readings, and publish when the syllabus is ready.',
  },
  {
    title: 'Assess understanding',
    body: 'Build quizzes with single choice, multiple choice, true/false and short answer questions. Grading runs server side.',
  },
  {
    title: 'Track real progress',
    body: 'Every completed lesson recalculates enrolment progress, and finishing a course issues a verifiable certificate.',
  },
];

const ROLES = [
  { role: 'Students', body: 'Browse the catalog, enrol, learn at your own pace and collect certificates.' },
  { role: 'Instructors', body: 'Create courses, manage a curriculum, grade submissions and watch your roster.' },
  { role: 'Administrators', body: 'Manage users and roles, organise categories and review the audit trail.' },
];

export function HomePage() {
  useDocumentTitle();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: featured, isLoading } = useListFeaturedCoursesQuery(undefined, { skip: isAuthenticated });

  return (
    <AppShell variant="fullWidth">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-16 text-white sm:px-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
            Learning management
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Build skills that bridge the gap
          </h1>
          <p className="mt-4 text-base text-brand-50 sm:text-lg">
            SkillBridge LMS gives instructors a structured way to publish courses and gives learners a
            clear path from first lesson to verified certificate.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Browse the catalog
            </Link>
            {!isAuthenticated ? (
              <Link
                to="/register"
                className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Create a learner account
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="section-title">What the platform does</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {!isAuthenticated ? (
        <section className="mt-14">
          <h2 className="section-title">Built for three roles</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {ROLES.map((item) => (
              <div key={item.role} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-brand-700">{item.role}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <p className="mt-14 text-sm text-slate-500">Loading featured courses…</p>
      ) : featured && featured.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Featured courses</h2>
            <Link to="/courses" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      ) : null}

      {!isAuthenticated ? (
        <section className="mt-16 rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="section-title">Ready to start?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Create a free learner account to enrol in published courses and track your progress.
          </p>
          <div className="mt-5 flex justify-center">
            <LinkButton to="/register">Create an account</LinkButton>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
