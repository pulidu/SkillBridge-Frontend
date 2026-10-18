import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LessonTypeBadge } from '@/components/course/RatingStars';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { useGetEnrollmentQuery } from '@/features/enrollments/enrollmentsApi';
import { useGetLessonQuery } from '@/features/curriculum/curriculumApi';
import { useCompleteLessonMutation, useIncompleteLessonMutation } from '@/features/progress/progressApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { errorMessage, formatDuration } from '@/lib/formatters';

export function LessonPage() {
  const { enrollmentId = '', lessonId = '' } = useParams();
  const navigate = useNavigate();

  const { data: enrollment, isLoading: isLoadingEnrollment } = useGetEnrollmentQuery(enrollmentId);
  const courseId = enrollment?.course.id ?? '';

  const {
    data: lesson,
    isLoading,
    isError,
    error,
  } = useGetLessonQuery({ courseId, lessonId }, { skip: !courseId });

  const [complete, { isLoading: isCompleting }] = useCompleteLessonMutation();
  const [incomplete, { isLoading: isIncompleting }] = useIncompleteLessonMutation();

  useDocumentTitle(lesson?.title);

  if (isLoading || isLoadingEnrollment) {
    return (
      <AppShell>
        <PageLoader />
      </AppShell>
    );
  }

  if (isError || !lesson || !enrollment) {
    return (
      <AppShell>
        <EmptyState
          title="Lesson unavailable"
          description={errorMessage(error, 'You may not be enrolled in this course.')}
          action={<Button onClick={() => navigate('/learn')}>Back to my learning</Button>}
        />
      </AppShell>
    );
  }

  const course = enrollment.course;
  const isDone = (enrollment.completedLessons ?? []).includes(lesson.id);

  const handleToggle = async () => {
    if (isDone) {
      await incomplete(lesson.id).unwrap();
    } else {
      await complete(lesson.id).unwrap();
    }
  };

  return (
    <AppShell>
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/learn" className="hover:text-brand-700">
          My learning
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/learn/courses/${enrollment.id}`} className="hover:text-brand-700">
          {course.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{lesson.title}</span>
      </nav>

      <Card>
        <CardHeader
          title={lesson.title}
          subtitle={`${formatDuration(lesson.durationMinutes)} · position ${lesson.position + 1}`}
          action={<LessonTypeBadge type={lesson.type} />}
        />

        <CardBody className="space-y-6">
          {lesson.videoUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
              <iframe
                src={lesson.videoUrl}
                title={lesson.title}
                allowFullScreen
                className="h-full w-full"
                // The API only accepts http(s) URLs, so the host is constrained
                // to a sandbox that cannot reach this origin's storage.
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            </div>
          ) : null}

          {lesson.content ? <p className="prose-body">{lesson.content}</p> : null}

          {lesson.attachments.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Attachments</h3>
              <ul className="space-y-1">
                {lesson.attachments.map((attachment) => (
                  <li key={attachment.url}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      {attachment.name}
                    </a>
                    <span className="ml-2 text-xs text-slate-400">
                      {Math.round(attachment.size / 1024)} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <Button
              variant={isDone ? 'outline' : 'primary'}
              isLoading={isCompleting || isIncompleting}
              onClick={() => void handleToggle()}
            >
              {isDone ? 'Mark as not complete' : 'Mark as complete'}
            </Button>

            <Button variant="ghost" onClick={() => navigate(`/learn/courses/${enrollment.id}`)}>
              Back to course
            </Button>

            {isDone ? (
              <span className="text-sm font-medium text-emerald-700">Completed</span>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </AppShell>
  );
}
