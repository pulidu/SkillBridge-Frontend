import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LevelBadge } from '@/components/course/LevelBadge';
import { ProgressBar } from '@/components/course/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { useGetEnrollmentQuery } from '@/features/enrollments/enrollmentsApi';
import { useGetCurriculumQuery } from '@/features/curriculum/curriculumApi';
import { useListCourseQuizzesQuery } from '@/features/quizzes/quizzesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { errorMessage, formatDuration } from '@/lib/formatters';

/**
 * Course player shell: shows the syllabus for an enrolment and links into the
 * lesson and quiz screens. Progress percentages come from the enrolment
 * document, which the API recalculates whenever a lesson is completed.
 */
export function CoursePlayerPage() {
  const { enrollmentId = '' } = useParams();
  const navigate = useNavigate();

  const { data: enrollment, isLoading, isError, error } = useGetEnrollmentQuery(enrollmentId);
  const courseId = enrollment?.course.id ?? '';

  const { data: curriculum } = useGetCurriculumQuery(
    { courseId },
    { skip: !courseId },
  );
  const { data: quizzes } = useListCourseQuizzesQuery(courseId, { skip: !courseId });

  useDocumentTitle(enrollment?.course.title);

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader />
      </AppShell>
    );
  }

  if (isError || !enrollment) {
    return (
      <AppShell>
        <EmptyState
          title="Enrolment not found"
          description={errorMessage(error, 'You may not have access to this course.')}
          action={
            <Button onClick={() => navigate('/learn')}>Back to my learning</Button>
          }
        />
      </AppShell>
    );
  }

  const course = enrollment.course;
  const allLessons = (curriculum?.modules ?? []).flatMap((module) => module.lessons);
  const completed = new Set(enrollment.completedLessons ?? []);
  const nextLesson = allLessons.find((lesson) => !completed.has(lesson.id));

  return (
    <AppShell>
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/learn" className="hover:text-brand-700">
          My learning
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{course.title}</span>
      </nav>

      <Card>
        <CardBody className="sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={course.level} />
                <Badge tone={enrollment.status === 'completed' ? 'success' : 'brand'}>
                  {enrollment.status}
                </Badge>
              </div>
              <h1 className="mt-2 text-xl font-bold text-slate-900">{course.title}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {completed.size} of {allLessons.length} lessons complete
              </p>
            </div>

            {nextLesson ? (
              <Button
                onClick={() =>
                  navigate(`/learn/courses/${enrollment.id}/lessons/${nextLesson.id}`)
                }
              >
                {completed.size === 0 ? 'Start course' : 'Continue'}
              </Button>
            ) : (
              <Badge tone="success">Course complete</Badge>
            )}
          </div>

          <ProgressBar value={enrollment.progress} className="mt-5" label="Overall progress" />
        </CardBody>
      </Card>

      <div className="mt-6 space-y-6">
        {(curriculum?.modules ?? []).map((module) => (
          <Card key={module.id}>
            <CardHeader title={module.title} subtitle={`${module.lessons.length} lessons`} />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {module.lessons.map((lesson) => {
                  const isDone = completed.has(lesson.id);

                  return (
                    <li key={lesson.id}>
                      <Link
                        to={`/learn/courses/${enrollment.id}/lessons/${lesson.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isDone ? '✓' : ''}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">{lesson.title}</p>
                            <p className="text-xs capitalize text-slate-500">
                              {lesson.type} · {formatDuration(lesson.durationMinutes)}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-xs font-medium text-brand-600">Open</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        ))}

        {(quizzes?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader title="Quizzes" subtitle="Graded automatically on submission." />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {quizzes?.map((quiz) => (
                  <li key={quiz.id}>
                    <Link
                      to={`/learn/quizzes/${quiz.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{quiz.title}</p>
                        <p className="text-xs text-slate-500">
                          {quiz.questions.length} questions · pass at {quiz.passingScore}% · up to{' '}
                          {quiz.maxAttempts} attempts
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-brand-600">Take quiz</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
