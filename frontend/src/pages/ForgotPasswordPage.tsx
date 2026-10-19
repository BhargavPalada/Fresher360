import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useNavigate } from 'react-router-dom';
import { useForgotPasswordMutation } from '../features/auth/api/authApi';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

/**
 * Fresher360 Brand Logo (reused from LoginPage)
 */
function Fresher360Logo() {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
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
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
        Fresher360
      </Typography>
    </Box>
  );
}

/**
 * ForgotPasswordPage — Step 1
 *
 * The user enters their email address. The backend sends an OTP if the
 * address is registered. The response is always generic to prevent account
 * enumeration.
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await forgotPassword({ email: data.email }).unwrap();
      setSubmitted(true);
    } catch {
      setServerError('Something went wrong. Please try again later.');
    }
  };

  if (submitted) {
    const email = getValues('email');
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
            maxWidth: 480,
            borderRadius: 4,
            background: '#ffffff',
            boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0',
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <EmailOutlinedIcon sx={{ fontSize: 32, color: '#2563eb' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            Check your inbox
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3, lineHeight: 1.7 }}>
            If <strong>{email}</strong> is registered with Fresher360, we've sent a
            6-digit verification code. It expires in 5 minutes.
          </Typography>
          <Button
            id="go-to-verify-otp-btn"
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate('/reset-password/verify', { state: { email } })}
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontSize: '0.95rem',
              fontWeight: 600,
              background: '#2563eb',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              '&:hover': { background: '#1d4ed8', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)' },
              mb: 2,
            }}
          >
            Enter Verification Code
          </Button>
          <Link
            component="button"
            type="button"
            id="back-to-login-link"
            onClick={() => navigate('/login')}
            underline="hover"
            sx={{ fontSize: '0.875rem', color: '#64748b', cursor: 'pointer', border: 'none', background: 'none', p: 0 }}
          >
            Back to Sign In
          </Link>
        </Card>
      </Box>
    );
  }

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
          maxWidth: 480,
          borderRadius: 4,
          background: '#ffffff',
          boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
          p: { xs: 4, sm: 6 },
        }}
      >
        <Stack spacing={1} sx={{ alignItems: 'center', mb: 3.5, textAlign: 'center' }}>
          <Fresher360Logo />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: '#0f172a', mt: 1.5 }}
          >
            Forgot Password?
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
            Enter your registered email and we'll send you a verification code.
          </Typography>
        </Stack>

        <Box
          component="form"
          id="forgot-password-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Stack spacing={2.5}>
            {serverError && (
              <Alert id="forgot-password-error-alert" severity="error" sx={{ borderRadius: 2 }}>
                {serverError}
              </Alert>
            )}

            <Box>
              <Typography
                component="label"
                htmlFor="forgot-email"
                sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Email Address
              </Typography>
              <TextField
                id="forgot-email"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                autoFocus
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={inputStyle}
              />
            </Box>

            <Button
              id="send-otp-button"
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              size="large"
              sx={{
                py: 1.4,
                borderRadius: 2,
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#2563eb',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease',
                '&:hover': { background: '#1d4ed8', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)' },
                '&:disabled': { background: '#94a3b8' },
              }}
            >
              {isLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Send Verification Code'}
            </Button>

            <Box sx={{ textAlign: 'center', pt: 0.5 }}>
              <Link
                component="button"
                type="button"
                id="back-to-login-link"
                onClick={() => navigate('/login')}
                underline="hover"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#2563eb',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  p: 0,
                }}
              >
                ← Back to Sign In
              </Link>
            </Box>
          </Stack>
        </Box>

        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'center', mt: 4, color: '#94a3b8', fontSize: '0.8rem' }}
        >
          © {new Date().getFullYear()} Fresher360. All rights reserved.
        </Typography>
      </Card>
    </Box>
  );
}

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    background: '#ffffff',
    fontSize: '0.925rem',
    color: '#0f172a',
    '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: '#cbd5e1' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '2px' },
  },
  '& .MuiFormHelperText-root': { mx: 0.5 },
};
