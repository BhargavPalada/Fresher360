import { useEffect, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { RoleRoute } from '../features/auth/components/RoleRoute';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import VerifyOtpPage from '../pages/VerifyOtpPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import AdminHomePage from '../pages/admin/AdminHomePage';
import UserHomePage from '../pages/user/UserHomePage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import { useGetCurrentUserQuery } from '../features/auth/api/authApi';
import {
  clearCredentials,
  selectAccessToken,
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsInitializing,
  setCredentials,
} from '../features/auth/authSlice';
import type { AppDispatch } from './store';

/**
 * AuthInitializer — attempts to restore session on app startup via GET /auth/me.
 * Uses the HttpOnly refresh cookie to silently refresh the access token if needed.
 * Must render inside Redux Provider but outside Router.
 */
function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  const isInitializing = useSelector(selectIsInitializing);
  const accessToken = useSelector(selectAccessToken);

  // Only execute on initial app startup while isInitializing is true.
  // Once initialization resolves (either authenticated or cleared), skip permanently.
  const { data, error, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !isInitializing,
  });

  useEffect(() => {
    if (!isInitializing || isLoading) return;

    if (data?.data) {
      dispatch(
        setCredentials({
          user: data.data,
          accessToken: accessToken || '',
        })
      );
    } else if (error) {
      dispatch(clearCredentials());
    }
  }, [isInitializing, data, error, isLoading, dispatch, accessToken]);

  return <>{children}</>;
}

function RootRedirect() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitializing = useSelector(selectIsInitializing);
  const user = useSelector(selectCurrentUser);

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/user'} replace />;
  }

  return <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <Navigate to="/forgot-password" replace />,
  },
  {
    path: '/reset-password/verify',
    element: <VerifyOtpPage />,
  },
  {
    path: '/reset-password/new',
    element: <ResetPasswordPage />,
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
            element: <AdminHomePage key="dashboard" view="dashboard" />,
          },
          {
            path: '/admin/users',
            element: <AdminHomePage key="users" view="users" />,
          },
          {
            path: '/admin/freshers',
            element: <Navigate to="/admin/users" replace />,
          },
          {
            path: '/admin/tasks',
            element: <AdminHomePage key="tasks" view="tasks" />,
          },
        ],
      },

      // User/Fresher-only routes
      {
        element: <RoleRoute allowedRole="USER" />,
        children: [
          {
            path: '/user',
            element: <UserHomePage key="dashboard" view="dashboard" />,
          },
          {
            path: '/user/tasks',
            element: <UserHomePage key="tasks" view="tasks" />,
          },
        ],
      },
    ],
  },

  // Root redirect
  {
    path: '/',
    element: <RootRedirect />,
  },

  // Catch-all
  {
    path: '*',
    element: <RootRedirect />,
  },
]);

export function AppRouter() {
  return (
    <AuthInitializer>
      <RouterProvider router={router} />
    </AuthInitializer>
  );
}
