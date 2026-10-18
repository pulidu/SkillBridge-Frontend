/**
 * Domain types mirroring the Mongoose schemas in `backend/src/models`.
 *
 * The API always returns `{ success, data, meta? }` (see
 * `backend/src/utils/response.ts`) and serialises `_id` as a string `id`.
 */

/* ------------------------------- shared enums ------------------------------ */

export const ROLES = ['admin', 'instructor', 'student'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['active', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const LESSON_TYPES = ['video', 'article', 'quiz', 'assignment'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const QUESTION_TYPES = ['single', 'multiple', 'truefalse', 'short'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const ENROLLMENT_STATUSES = ['active', 'completed', 'cancelled'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const SUBMISSION_STATUSES = ['submitted', 'graded', 'returned'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  'enrollment',
  'course_update',
  'grade',
  'announcement',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const COURSE_SORT_OPTIONS = [
  'newest',
  'oldest',
  'title',
  'rating',
  'popular',
  'duration',
] as const;
export type CourseSort = (typeof COURSE_SORT_OPTIONS)[number];

/* ------------------------------- envelopes -------------------------------- */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: FieldError[];
}

/** Discriminated result returned by the transport layer. */
export type ApiResult<T> =
  | { ok: true; status: number; data: T; meta?: PaginationMeta }
  | { ok: false; status: number; message: string; errors?: FieldError[] };

export type Paginated<T> = { items: T[]; meta: PaginationMeta };

/* --------------------------------- entities -------------------------------- */

export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: Role[];
  primaryRole: Role;
  initials: string;
  avatarUrl?: string;
  bio?: string;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  courseCount?: number;
  createdAt?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  category: string | Category;
  instructor: string | InstructorSummary;
  level: CourseLevel;
  status: CourseStatus;
  price: number;
  currency: string;
  tags: string[];
  outcomes: string[];
  requirements: string[];
  durationMinutes: number;
  totalLessons: number;
  enrollmentCount: number;
  averageRating: number;
  ratingCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorSummary {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
}

export interface CourseAnalytics {
  course: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  averageScore: number;
  totalQuizzes: number;
  quizAttempts: number;
}

export interface CourseModule {
  id: string;
  course: string;
  title: string;
  description?: string;
  position: number;
  lessonCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonAttachment {
  name: string;
  url: string;
  size: number;
  mimeType?: string;
}

export interface Lesson {
  id: string;
  course: string;
  module?: string;
  title: string;
  slug: string;
  content?: string;
  videoUrl?: string;
  attachments: LessonAttachment[];
  type: LessonType;
  position: number;
  durationMinutes: number;
  isPreview: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Curriculum {
  course: string;
  modules: Array<CourseModule & { lessons: Lesson[] }>;
  totalLessons: number;
  totalDurationMinutes: number;
}

export interface QuizOption {
  _id?: string;
  text: string;
  /** Only ever present for instructors and admins. */
  isCorrect?: boolean;
}

export interface QuizQuestion {
  _id?: string;
  text: string;
  type: QuestionType;
  options: QuizOption[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  course: string;
  lesson?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimitMinutes?: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerInput {
  question: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}

export interface QuizAttempt {
  id: string;
  quiz: string;
  course: string;
  student: string;
  enrollment?: string;
  answers: Array<AnswerInput & { isCorrect?: boolean; pointsAwarded?: number }>;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  timeSpentSeconds: number;
  submittedAt: string;
}

export interface Enrollment {
  id: string;
  course: string | Course;
  student: string | User;
  status: EnrollmentStatus;
  progress: number;
  completedLessons: string[];
  timeSpentMinutes: number;
  lastAccessedAt?: string;
  completedAt?: string;
  finalScore?: number;
  createdAt: string;
}

export interface EnrollmentDetail extends Enrollment {
  course: Course;
}

export interface ProgressSummary {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  totalTimeSpentMinutes: number;
  certificatesEarned: number;
  items: EnrollmentDetail[];
}

export interface EnrollmentProgressDetail {
  enrollment: string;
  course: string;
  progress: number;
  completedLessons: string[];
  totalLessons: number;
  remainingLessons: string[];
  status: EnrollmentStatus;
}

export interface Submission {
  id: string;
  course: string | Course;
  lesson?: string;
  assignmentTitle: string;
  student: string | User;
  enrollment?: string;
  content?: string;
  attachments: LessonAttachment[];
  status: SubmissionStatus;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  dueAt?: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  serialNumber: string;
  course: string | Course;
  student: string | User;
  enrollment?: string;
  finalScore?: number;
  issuedAt: string;
  revokedAt?: string;
  revokedBy?: string;
}

export interface Rating {
  id: string;
  course: string;
  user: string | User;
  value: number;
  review?: string;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: Record<string, number>;
}

export interface AppNotification {
  id: string;
  user: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor?: string;
  actorRole?: Role;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface StudentDashboard {
  enrolledCourses: number;
  completedCourses: number;
  totalTimeSpentMinutes: number;
  averageQuizScore: number;
  certificates: number;
  recentEnrollments: EnrollmentDetail[];
}

export interface InstructorDashboard {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalLearners: number;
  averageCompletion: number;
  averageRating: number;
  pendingSubmissions: number;
  topCourses: Course[];
}

export interface AdminDashboard {
  totalUsers: number;
  students: number;
  instructors: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalQuizzes: number;
  certificatesIssued: number;
  signupsLast30Days: number;
  revenueProxy: number;
  topCourses: Course[];
  roleBreakdown: Array<{ role: Role; count: number }>;
  pendingSubmissions?: number;
  totalActiveStudents?: number;
  totalActiveInstructors?: number;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
}

/* ------------------------------- study planner ---------------------------- */

export type StudyTaskPriority = 'low' | 'medium' | 'high';
export type StudyTaskStatus = 'todo' | 'in_progress' | 'completed';
export type StudyTaskSource = 'manual' | 'assignment';

export interface StudyTask {
  id: string;
  student: string;
  course?: { id: string; title: string; slug: string } | null;
  assignment?: { id: string; title: string; dueDate?: string; maxMarks?: number } | null;
  title: string;
  description?: string;
  dueDate: string;
  estimatedStudyMinutes: number;
  priority: StudyTaskPriority;
  status: StudyTaskStatus;
  source: StudyTaskSource;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyScheduleDay {
  day: string;
  date: string;
  tasks: StudyTask[];
  totalMinutes: number;
  completedCount: number;
}

export interface WeeklySchedule {
  weekStart: string;
  weekEnd: string;
  totalWeeklyTasks: number;
  completedWeeklyTasks: number;
  totalWeeklyMinutes: number;
  scheduleByDay: WeeklyScheduleDay[];
}

export interface StudentPlannerStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueTasks: number;
  tasksDueThisWeek: number;
  remainingStudyMinutes: number;
}

export interface AdminPlannerStats {
  activePlannerStudentsCount: number;
  totalPlannerTasks: number;
  assignmentLinkedTasksCount: number;
  overallCompletionRate: number;
  upcomingAssignmentDeadlinesCount: number;
}

export interface InstructorPlannerStats {
  courses: Array<{
    courseId: string;
    courseTitle: string;
    totalAssignmentTasks: number;
    completedAssignmentTasks: number;
    completionRate: number;
  }>;
}

