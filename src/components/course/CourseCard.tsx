import { Link } from 'react-router-dom';
import { LevelBadge } from './LevelBadge';
import { formatCompactNumber, formatDuration, formatPrice, nameOf, truncate } from '@/lib/formatters';
import type { Course } from '@/types';

export interface CourseCardProps {
  course: Course;
  /** Students reach the player through an enrolment, not a course id. */
  enrollmentId?: string;
}

export function CourseCard({ course, enrollmentId }: CourseCardProps) {
  const detailHref = enrollmentId
    ? `/learn/courses/${enrollmentId}`
    : `/courses/${course.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={detailHref} className="block">
        <div className="relative h-36 w-full overflow-hidden bg-slate-100">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white/90">
              {course.title.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="absolute left-3 top-3">
            <LevelBadge level={course.level} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
          <Link to={detailHref} className="hover:text-brand-700">
            {course.title}
          </Link>
        </h3>

        <p className="mt-1 text-xs text-slate-500">by {nameOf(course.instructor)}</p>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">
          {truncate(course.shortDescription || course.description, 110)}
        </p>

        <dl className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <dt className="sr-only">Duration</dt>
            <dd>{formatDuration(course.durationMinutes)}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Lessons</dt>
            <dd>{course.totalLessons} lessons</dd>
          </div>
          {course.ratingCount > 0 ? (
            <div className="flex items-center gap-1">
              <dt className="sr-only">Rating</dt>
              <dd aria-label={`Rated ${course.averageRating} out of 5`}>
                <StarIcon /> {course.averageRating.toFixed(1)}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center gap-1">
            <dt className="sr-only">Learners</dt>
            <dd>{formatCompactNumber(course.enrollmentCount)} learners</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-semibold text-slate-900">{formatPrice(course.price, course.currency)}</span>
          <span className="text-xs font-medium text-brand-600">{enrollmentId ? 'Continue' : 'View course'}</span>
        </div>
      </div>
    </article>
  );
}

export function CourseGrid({ courses, enrollmentIds }: { courses: Course[]; enrollmentIds?: Record<string, string> }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} enrollmentId={enrollmentIds?.[course.id]} />
      ))}
    </div>
  );
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-amber-400">
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}
