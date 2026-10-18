import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated, selectStatus } from '@/features/auth/authSlice';
import { PageLoader } from '@/components/ui/Spinner';

/**
 * Gate for every authenticated route.
 *
 * While the session is being re-established from the refresh cookie the router
 * waits rather than redirecting, otherwise a hard refresh on a protected page
 * would bounce the user to `/login` even though their session is still valid.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectStatus);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <PageLoader label="Restoring your session" />;
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
