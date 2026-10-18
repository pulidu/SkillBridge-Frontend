import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated, selectStatus } from '@/features/auth/authSlice';
import { PageLoader } from '@/components/ui/Spinner';

/**
 * Keeps signed-in users off `/login`, `/register` and `/forgot-password` by
 * sending them to their role's dashboard instead.
 */
export function PublicOnlyRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectStatus);

  if (status === 'idle' || status === 'loading') {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
