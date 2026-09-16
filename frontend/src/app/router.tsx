import { useEffect, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { RoleRoute } from '../features/auth/components/RoleRoute';
import LoginPage from '../pages/LoginPage';
import AdminHomePage from '../pages/admin/AdminHomePage';
import UserHomePage from '../pages/user/UserHomePage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import { useGetCurrentUserQuery } from '../features/auth/api/authApi';
import {
  clearCredentials,
  selectIsAuthenticated,
  setInitializing,
} from '../features/auth/authSlice';
import type { AppDispatch } from './store';

/**
 * AuthInitializer — attempts to restore session on app startup via GET /auth/me.
 * Uses the HttpOnly refresh cookie to silently refresh the access token if needed.
 * Must render inside Redux Provider but outside Router.
 */
function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  // Skip /me call once authenticated (e.g., after login)
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const { data, error, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: isAuthenticated,
  });

  useEffect(() => {
    if (isLoading) return;

    if (data?.data) {
      // We need an access token — this comes from the refresh flow inside baseQueryWithReauth
      // For the /me scenario, the token is already in Redux if we just logged in.
      // If restoring from cookie (page refresh), the reauth middleware handles it.
      dispatch(setInitializing(false));
    } else if (error) {
      dispatch(clearCredentials());
      dispatch(setInitializing(false));
    }
  }, [data, error, isLoading, dispatch]);

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // ── Protected routes ───────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      // Admin-only routes
      {
        element: <RoleRoute allowedRole="ADMIN" />,
        children: [
          {
            path: '/admin',
            element: <AdminHomePage view="dashboard" />,
          },
          {
            path: '/admin/users',
            element: <AdminHomePage view="users" />,
          },
          {
            path: '/admin/freshers',
            element: <Navigate to="/admin/users" replace />,
          },
          {
            path: '/admin/tasks',
            element: <AdminHomePage view="tasks" />,
          },
        ],
      },

      // User/Fresher-only routes
      {
        element: <RoleRoute allowedRole="USER" />,
        children: [
          {
            path: '/user',
            element: <UserHomePage view="dashboard" />,
          },
          {
            path: '/user/tasks',
            element: <UserHomePage view="tasks" />,
          },
        ],
      },
    ],
  },

  // Root redirect
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export function AppRouter() {
  return (
    <AuthInitializer>
      <RouterProvider router={router} />
    </AuthInitializer>
  );
}
