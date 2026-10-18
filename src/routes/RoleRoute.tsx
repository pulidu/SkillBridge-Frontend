import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectHasRole } from '@/features/auth/authSlice';
import type { Role } from '@/types';

export interface RoleRouteProps {
  roles: Role[];
}

/**
 * Coarse role gate. It mirrors the API's `authorize(...roles)` middleware, but
 * it is a UX affordance only: every route is protected server side as well, so
 * editing this component can never grant access the API would refuse.
 */
export function RoleRoute({ roles }: RoleRouteProps) {
  const isAllowed = useAppSelector(selectHasRole(roles));

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
