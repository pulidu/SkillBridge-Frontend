import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CourseStatusBadge, LevelBadge } from '@/components/course/LevelBadge';
import { LessonTypeBadge } from '@/components/course/RatingStars';
import { RatingStars } from '@/components/course/RatingStars';
import { FieldErrorList } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Textarea } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { useGetCourseBySlugQuery, useRateCourseMutation } from '@/features/courses/coursesApi';
import { useGetCurriculumQuery } from '@/features/curriculum/curriculumApi';
import { useEnrollMutation, useGetMyEnrollmentsQuery } from '@/features/enrollments/enrollmentsApi';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/authSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrors, errorMessage, formatDuration, formatPrice, nameOf } from '@/lib/formatters';

export function CourseDetailPage() {
  const { slug = '' } = useParams();
  const user = useAppSelector(selectUser);

  const { data: course, isLoading, isError, error, refetch } = useGetCourseBySlugQuery(slug);
  const { data: curriculum } = useGetCurriculumQuery(
    { courseId: course?.id ?? '' },
    { skip: !course?.id },
  );
  const { data: myEnrollments } = useGetMyEnrollmentsQuery(undefined, { skip: !user });

  const [enroll, { isLoading: isEnrolling }] = useEnrollMutation();
  const [rateCourse, { isLoading: isRating }] = useRateCourseMutation();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [actionError, setActionError] = useState<unknown>(null);

  useDocumentTitle(course?.title);

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader />
      </AppShell>
    );
  }

  if (isError || !course) {
    return (
      <AppShell>
        <EmptyState
          title="Course not found"
          description={errorMessage(error, 'This course may have been unpublished or removed.')}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </AppShell>
    );
  }

  const existingEnrollment = myEnrollments?.items.find((item) => item.course.id === course.id);
  const isEnrolled = Boolean(existingEnrollment);

  const handleEnroll = async () => {
    setActionError(null);
    try {
      await enroll({ course: course.id }).unwrap();
    } catch (err) {
      setActionError(err);
    }
  };

  const handleRate = async () => {
    if (rating === 0) return;
    setActionError(null);
    try {
      await rateCourse({ id: course.id, body: { value: rating, review: review || undefined } }).unwrap();
      setRating(0);
      setReview('');
    } catch (err) {
      setActionError(err);
    }
  };

  return (
    <AppShell>
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/courses" className="hover:text-brand-700">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{course.title}</span>
      </nav>

      <Card>
        <CardBody className="sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={course.level} />
                <CourseStatusBadge status={course.status} />
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {course.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                by {nameOf(course.instructor)} · {formatDuration(course.durationMinutes)} ·{' '}
                {course.totalLessons} lessons
              </p>

              {course.averageRating > 0 ? (
                <div className="mt-3">
                  <RatingStars value={course.averageRating} count={course.ratingCount} />
                </div>
              ) : null}
            </div>

            <div className="w-full shrink-0 rounded-xl border border-slate-200 p-5 sm:w-64">
              <p className="text-2xl font-bold text-slate-900">
                {formatPrice(course.price, course.currency)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Full lifetime access</p>

              <div className="mt-4">
                {isEnrolled && existingEnrollment ? (
                  <Link
                    to={`/learn/courses/${existingEnrollment.id}`}
                    className="flex h-10 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                  >
                    Continue learning
                  </Link>
                ) : user ? (
                  <Button
                    fullWidth
                    isLoading={isEnrolling}
                    disabled={course.status !== 'published'}
                    onClick={() => void handleEnroll()}
                  >
                    {course.status === 'published' ? 'Enrol now' : 'Not open for enrolment'}
                  </Button>
                ) : (
                  <Link
                    to="/login"
                    className="flex h-10 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                  >
                    Sign in to enrol
                  </Link>
                )}
              </div>

              {actionError ? (
                <div className="mt-3">
                  <FieldErrorList errors={apiErrors(actionError)} />
                </div>
              ) : null}
            </div>
          </div>

          <p className="prose-body mt-6">{course.description}</p>
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Curriculum"
              subtitle={`${curriculum?.totalLessons ?? course.totalLessons} lessons · ${formatDuration(
                curriculum?.totalDurationMinutes ?? course.durationMinutes,
              )}`}
            />
            <CardBody className="p-0">
              {(curriculum?.modules ?? []).map((module) => (
                <div key={module.id} className="border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
                    <h4 className="text-sm font-semibold text-slate-800">{module.title}</h4>
                    <span className="text-xs text-slate-500">{module.lessons.length} lessons</span>
                  </div>

                  <ul className="divide-y divide-slate-50">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-700">{lesson.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {lesson.type === 'quiz' || lesson.type === 'assignment'
                              ? lesson.type
                              : formatDuration(lesson.durationMinutes)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {lesson.isPreview ? (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                              Preview
                            </span>
                          ) : null}
                          <LessonTypeBadge type={lesson.type} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {curriculum && curriculum.modules.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  The curriculum has not been published yet.
                </div>
              ) : null}
            </CardBody>
          </Card>

          {course.outcomes.length > 0 ? (
            <Card>
              <CardHeader title="What you will learn" />
              <CardBody>
                <ul className="space-y-2">
                  {course.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-2 text-sm text-slate-700">
                      <span aria-hidden="true" className="mt-0.5 text-emerald-600">
                        ✓
                      </span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {user ? (
            <Card>
              <CardHeader title="Rate this course" subtitle="One rating per account." />
              <CardBody className="space-y-4">
                {actionError ? <FieldErrorList errors={apiErrors(actionError)} /> : null}

                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Your rating</p>
                  <RatingStars value={rating} interactive onChange={setRating} />
                </div>

                <Textarea
                  label="Review"
                  rows={3}
                  value={review}
                  maxLength={1000}
                  onChange={(event) => setReview(event.target.value)}
                  placeholder="What did you think of this course?"
                />

                <Button isLoading={isRating} disabled={rating === 0} onClick={() => void handleRate()}>
                  Submit rating
                </Button>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {course.requirements.length > 0 ? (
            <Card>
              <CardHeader title="Requirements" />
              <CardBody>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                  {course.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Course facts" />
            <CardBody>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Level</dt>
                  <dd className="font-medium capitalize text-slate-900">{course.level}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Lessons</dt>
                  <dd className="font-medium text-slate-900">{course.totalLessons}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Duration</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDuration(course.durationMinutes)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Learners</dt>
                  <dd className="font-medium text-slate-900">{course.enrollmentCount}</dd>
                </div>
                {course.publishedAt ? (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Published</dt>
                    <dd className="font-medium text-slate-900">
                      {new Date(course.publishedAt).toLocaleDateString()}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

