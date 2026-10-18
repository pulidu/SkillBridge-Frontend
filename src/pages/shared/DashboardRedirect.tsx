import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { dashboardPathFor, selectPrimaryRole, selectStatus } from '@/features/auth/authSlice';
import { PageLoader } from '@/components/ui/Spinner';

/**
 * `/dashboard` is role aware: admins land on the platform dashboard,
 * instructors on their teaching dashboard, everyone else on their learning page.
 */
export function DashboardRedirect() {
  const status = useAppSelector(selectStatus);
  const role = useAppSelector(selectPrimaryRole);

  if (status === 'idle' || status === 'loading') {
    return <PageLoader />;
  }

  return <Navigate to={dashboardPathFor(role)} replace />;
}
