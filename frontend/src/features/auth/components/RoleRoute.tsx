import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../authSlice';
import type { UserRole } from '../types/auth.types';

interface RoleRouteProps {
  allowedRole: UserRole;
  redirectTo?: string;
}

/**
 * RoleRoute — guards routes by role.
 *
 * If the authenticated user's role doesn't match, redirects to /unauthorized.
 *
 * SECURITY NOTE: This is a UX guard only.
 * Backend independently enforces role-based access on every request.
 * Changing the role in Redux or browser storage does NOT grant backend access.
 */
export function RoleRoute({ allowedRole, redirectTo = '/unauthorized' }: RoleRouteProps) {
  const user = useSelector(selectCurrentUser);

  if (!user || user.role !== allowedRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
