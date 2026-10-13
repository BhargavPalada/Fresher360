import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import {
  selectIsAuthenticated,
  selectIsInitializing,
} from '../authSlice';

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * Shows a loading state while authentication is being initialized.
 *
 * NOTE: This is a UX guard only. The real security boundary is the backend.
 */
export function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitializing = useSelector(selectIsInitializing);
  const location = useLocation();

  if (isInitializing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f8fafc',
        }}
      >
        <CircularProgress size={44} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
