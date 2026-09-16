import {
  Box,
  Card,
  Stack,
  Typography,
} from '@mui/material';
import { LoginForm } from '../features/auth/components/login';
import loginIllustration from '../assets/login-illustration.jpg';

/**
 * Fresher360 Brand Icon SVG matching mockup
 */
function Fresher360Logo() {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '1.25rem',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          letterSpacing: '-0.05em',
        }}
      >
        FB
      </Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.02em',
        }}
      >
        Fresher360
      </Typography>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        p: { xs: 2, md: 4 },
        boxSizing: 'border-box',
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 1040,
          borderRadius: 4,
          background: '#ffffff',
          boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          minHeight: 580,
        }}
      >
        {/* ── Left Column: Vector Illustration & Soft Blue Background ── */}
        <Box
          sx={{
            flex: 1.1,
            background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            position: 'relative',
            borderRight: '1px solid #f1f5f9',
          }}
        >
          <Box
            component="img"
            src={loginIllustration}
            alt="Fresher working on dashboard"
            sx={{
              width: '90%',
              maxWidth: 420,
              height: 'auto',
              borderRadius: 3,
              boxShadow: '0 12px 36px rgba(37, 99, 235, 0.12)',
              objectFit: 'cover',
            }}
          />
        </Box>

        {/* ── Right Column: Clean Login Form ── */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 4, sm: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: 480,
            mx: 'auto',
            width: '100%',
          }}
        >
          <Stack spacing={1} sx={{ alignItems: 'center', mb: 3.5, textAlign: 'center' }}>
            <Fresher360Logo />

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#0f172a',
                mt: 1.5,
              }}
            >
              Welcome Back!
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '0.9rem',
              }}
            >
              Please sign in to your account
            </Typography>
          </Stack>

          {/* ── Form ── */}
          <LoginForm />

          {/* ── Footer ── */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 4,
              color: '#94a3b8',
              fontSize: '0.8rem',
            }}
          >
            © {new Date().getFullYear()} Fresher360. All rights reserved.
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
