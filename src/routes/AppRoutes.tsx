import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { RoleRoute } from './RoleRoute';

import { HomePage } from '@/pages/public/HomePage';
import { CourseCatalogPage } from '@/pages/public/CourseCatalogPage';
import { CourseDetailPage } from '@/pages/public/CourseDetailPage';
import { CategoryPage } from '@/pages/public/CategoryPage';
import { VerifyCertificatePage } from '@/pages/public/VerifyCertificatePage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

import { DashboardRedirect } from '@/pages/shared/DashboardRedirect';
import { UnauthorizedPage } from '@/pages/shared/UnauthorizedPage';
import { NotificationsPage } from '@/pages/shared/NotificationsPage';
import { ProfilePage } from '@/pages/shared/ProfilePage';

import { MyLearningPage } from '@/pages/student/MyLearningPage';
import { CoursePlayerPage } from '@/pages/student/CoursePlayerPage';
import { LessonPage } from '@/pages/student/LessonPage';
import { QuizAttemptPage } from '@/pages/student/QuizAttemptPage';
import { MyProgressPage } from '@/pages/student/MyProgressPage';
import { MyCertificatesPage } from '@/pages/student/MyCertificatesPage';
import { MySubmissionsPage } from '@/pages/student/MySubmissionsPage';
import { StudyPlannerPage } from '@/pages/student/StudyPlannerPage';
import { WeeklySchedulePage } from '@/pages/student/WeeklySchedulePage';

import { InstructorDashboardPage } from '@/pages/instructor/InstructorDashboardPage';
import { InstructorCourseListPage } from '@/pages/instructor/InstructorCourseListPage';
import { CourseEditorPage } from '@/pages/instructor/CourseEditorPage';
import { CurriculumBuilderPage } from '@/pages/instructor/CurriculumBuilderPage';
import { LessonEditorPage } from '@/pages/instructor/LessonEditorPage';
import { QuizEditorPage } from '@/pages/instructor/QuizEditorPage';
import { RosterPage } from '@/pages/instructor/RosterPage';
import { GradingQueuePage } from '@/pages/instructor/GradingQueuePage';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { CategoryManagementPage } from '@/pages/admin/CategoryManagementPage';
import { AdminCourseListPage } from '@/pages/admin/AdminCourseListPage';
import { AdminEnrollmentsPage } from '@/pages/admin/AdminEnrollmentsPage';
import { AdminSubmissionsPage } from '@/pages/admin/AdminSubmissionsPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';

/**
 * Route table.
 *
 * Three nested gate layers mirror the three-tier permission model:
 *   PublicOnlyRoute -> guest-only screens
 *   ProtectedRoute  -> any authenticated user
 *   RoleRoute       -> one specific role
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* ------------------------------ public ------------------------------- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CourseCatalogPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      <Route path="/categories/:slug" element={<CategoryPage />} />
      <Route path="/verify" element={<VerifyCertificatePage />} />

      {/* ------------------------- guest-only screens ------------------------ */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* ------------------------- any authenticated ------------------------- */}
      <Route element={<ProtectedRoute />}>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* ----------------------------- student ----------------------------- */}
        <Route element={<RoleRoute roles={['student']} />}>
          <Route path="/learn" element={<MyLearningPage />} />
          <Route path="/learn/courses/:enrollmentId" element={<CoursePlayerPage />} />
          <Route
            path="/learn/courses/:enrollmentId/lessons/:lessonId"
            element={<LessonPage />}
          />
          <Route path="/learn/quizzes/:quizId" element={<QuizAttemptPage />} />
          <Route path="/learn/progress" element={<MyProgressPage />} />
          <Route path="/learn/certificates" element={<MyCertificatesPage />} />
          <Route path="/learn/submissions" element={<MySubmissionsPage />} />
          <Route path="/planner" element={<StudyPlannerPage />} />
          <Route path="/planner/weekly" element={<WeeklySchedulePage />} />
        </Route>

        {/* --------------------------- instructor --------------------------- */}
        <Route element={<RoleRoute roles={['instructor']} />}>
          <Route path="/instructor" element={<InstructorDashboardPage />} />
          <Route path="/instructor/courses" element={<InstructorCourseListPage />} />
          <Route path="/instructor/courses/new" element={<CourseEditorPage />} />
          <Route path="/instructor/courses/:courseId/edit" element={<CourseEditorPage />} />
          <Route
            path="/instructor/courses/:courseId/curriculum"
            element={<CurriculumBuilderPage />}
          />
          <Route
            path="/instructor/courses/:courseId/lessons/:lessonId"
            element={<LessonEditorPage />}
          />
          <Route
            path="/instructor/courses/:courseId/quizzes/:quizId"
            element={<QuizEditorPage />}
          />
          <Route path="/instructor/courses/:courseId/students" element={<RosterPage />} />
          <Route path="/instructor/submissions" element={<GradingQueuePage />} />
        </Route>

        {/* ------------------------------ admin ------------------------------ */}
        <Route element={<RoleRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/categories" element={<CategoryManagementPage />} />
          <Route path="/admin/courses" element={<AdminCourseListPage />} />
          <Route path="/admin/enrollments" element={<AdminEnrollmentsPage />} />
          <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
