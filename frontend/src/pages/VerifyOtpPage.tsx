import { useEffect, useRef, useState } from 'react';
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
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForgotPasswordMutation, useVerifyOtpMutation } from '../features/auth/api/authApi';

const schema = z.object({
  otp: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});

type FormValues = z.infer<typeof schema>;

function Fresher360Logo() {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 38, height: 38, borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', fontWeight: 800, fontSize: '1.25rem',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', letterSpacing: '-0.05em',
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
 * VerifyOtpPage — Step 2
 *
 * The user enters the 6-digit code from their email. On success, they are
 * navigated to the reset-password page with the reset token carried in
 * React Router location state (never in localStorage).
 */
export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email: string = (location.state as { email?: string })?.email ?? '';

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [forgotPassword] = useForgotPasswordMutation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start a 60 s resend cooldown on mount
  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown(seconds = 60) {
    setCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { otp: '' },
  });

  // Redirect back if no email in state (e.g., direct URL access)
  if (!email) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <Card elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: 400 }}>
          <Typography sx={{ mb: 2, color: '#334155' }}>
            No email provided. Please start the password reset flow again.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/forgot-password')} sx={{ background: '#2563eb' }}>
            Go to Forgot Password
          </Button>
        </Card>
      </Box>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      const result = await verifyOtp({ email, otp: data.otp }).unwrap();
      if (result.data?.reset_token) {
        // Pass reset_token via location state — never localStorage
        navigate('/reset-password/new', {
          state: { reset_token: result.data.reset_token },
          replace: true,
        });
      }
    } catch (err: unknown) {
      const apiErr = err as {
        data?: {
          error?: { message?: string; code?: string };
          detail?: string | { message?: string; code?: string };
        };
      };
      const code =
        apiErr?.data?.error?.code ||
        (typeof apiErr?.data?.detail === 'object' ? apiErr.data.detail?.code : undefined);
      const message =
        apiErr?.data?.error?.message ||
        (typeof apiErr?.data?.detail === 'object'
          ? apiErr.data.detail?.message
          : apiErr?.data?.detail) ||
        'Invalid code. Please try again.';

      if (code === 'OTP_EXPIRED') {
        setServerError('Your code has expired. Please request a new one.');
      } else if (code === 'OTP_MAX_ATTEMPTS') {
        setServerError('Too many incorrect attempts. Please request a new code.');
      } else {
        setServerError(message);
      }
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setServerError(null);
    setResendSuccess(false);
    setResending(true);
    try {
      await forgotPassword({ email }).unwrap();
      setResendSuccess(true);
      startCountdown(60);
    } catch (err: unknown) {
      const apiErr = err as {
        data?: {
          error?: { message?: string; code?: string };
          detail?: string | { message?: string; code?: string };
        };
      };
      const message =
        apiErr?.data?.error?.message ||
        (typeof apiErr?.data?.detail === 'object'
          ? apiErr.data.detail?.message
          : apiErr?.data?.detail) ||
        'Failed to resend code. Please try again.';
      setServerError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', width: '100vw', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f1f5f9', p: { xs: 2, md: 4 }, boxSizing: 'border-box',
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%', maxWidth: 480, borderRadius: 4,
          background: '#ffffff', boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0', p: { xs: 4, sm: 6 },
        }}
      >
        <Stack spacing={1} sx={{ alignItems: 'center', mb: 3.5, textAlign: 'center' }}>
          <Fresher360Logo />
          <Box
            sx={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2,
            }}
          >
            <LockResetOutlinedIcon sx={{ fontSize: 28, color: '#2563eb' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mt: 1 }}>
            Enter Verification Code
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
            We sent a 6-digit code to{' '}
            <Typography component="span" sx={{ fontWeight: 600, color: '#334155', fontSize: 'inherit' }}>
              {email}
            </Typography>
          </Typography>
        </Stack>

        <Box component="form" id="verify-otp-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5}>
            {serverError && (
              <Alert id="otp-error-alert" severity="error" sx={{ borderRadius: 2 }}>
                {serverError}
              </Alert>
            )}
            {resendSuccess && (
              <Alert id="otp-resend-alert" severity="success" sx={{ borderRadius: 2 }}>
                A new code has been sent to your email.
              </Alert>
            )}

            <Box>
              <Typography
                component="label"
                htmlFor="otp-input"
                sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Verification Code <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
              </Typography>
              <TextField
                id="otp-input"
                placeholder="123456"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                fullWidth
                {...register('otp')}
                error={!!errors.otp}
                helperText={errors.otp?.message}
                slotProps={{
                  htmlInput: {
                    'aria-label': 'Verification Code',
                    maxLength: 6,
                    style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em', fontWeight: 700 },
                  },
                }}
                sx={inputStyle}
              />
            </Box>

            <Button
              id="verify-otp-button"
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              size="large"
              sx={{
                py: 1.4, borderRadius: 2, fontSize: '0.95rem', fontWeight: 600,
                background: '#2563eb', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease',
                '&:hover': { background: '#1d4ed8', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)' },
                '&:disabled': { background: '#94a3b8' },
              }}
            >
              {isLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Verify Code'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
                Didn't receive a code?{' '}
                <Link
                  component="button"
                  type="button"
                  id="resend-otp-btn"
                  onClick={handleResend}
                  underline="hover"
                  disabled={countdown > 0 || resending}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: countdown > 0 ? '#94a3b8' : '#2563eb',
                    cursor: countdown > 0 ? 'default' : 'pointer',
                    border: 'none',
                    background: 'none',
                    p: 0,
                    verticalAlign: 'baseline',
                  }}
                >
                  {resending ? 'Sending…' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
                </Link>
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                id="back-to-forgot-link"
                onClick={() => navigate('/forgot-password')}
                underline="hover"
                sx={{
                  fontSize: '0.875rem', fontWeight: 500, color: '#64748b',
                  cursor: 'pointer', border: 'none', background: 'none', p: 0,
                }}
              >
                ← Use a different email
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
    borderRadius: 2, background: '#ffffff', fontSize: '0.925rem', color: '#0f172a',
    '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: '#cbd5e1' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '2px' },
  },
  '& .MuiFormHelperText-root': { mx: 0.5 },
};
