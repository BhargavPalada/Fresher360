import { Box, Button, Stack, Typography } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import LoginIcon from '@mui/icons-material/Login';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleBackToLogin = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate(user?.role === 'ADMIN' ? '/admin' : '/user', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        p: 3,
      }}
    >
      <Stack
        spacing={3}
        sx={{
          alignItems: 'center',
          textAlign: 'center',
          p: 5,
          borderRadius: 4,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)',
          maxWidth: 440,
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BlockIcon sx={{ color: '#ef4444', fontSize: 36 }} />
        </Box>

        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}
          >
            403 - Access Denied
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 1, fontSize: '0.95rem' }}>
            You don't have permission to access this page. Please sign in with an authorized account or return to your dashboard.
          </Typography>
        </Box>

        <Stack direction="column" spacing={1.5} sx={{ width: '100%' }}>
          <Button
            id="back-to-login-btn"
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={handleBackToLogin}
            fullWidth
            sx={{
              background: '#2563eb',
              borderRadius: 2,
              py: 1.2,
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': {
                background: '#1d4ed8',
              },
            }}
          >
            Back to Login Page
          </Button>

          {user && (
            <Button
              id="go-to-dashboard-btn"
              variant="outlined"
              startIcon={<DashboardIcon />}
              onClick={handleGoToDashboard}
              fullWidth
              sx={{
                borderColor: '#e2e8f0',
                color: '#334155',
                borderRadius: 2,
                py: 1.2,
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#cbd5e1',
                  background: '#f8fafc',
                },
              }}
            >
              Go to My Dashboard
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
