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
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResetPasswordMutation } from '../features/auth/api/authApi';

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/\d/, 'Must contain at least one digit')
      .regex(/[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'/`~]/, 'Must contain at least one special character'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
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
 * ResetPasswordPage — Step 3
 *
 * The reset_token is received via React Router location state (not localStorage).
 * On success the user is navigated to /login with a success notice.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken: string = (location.state as { reset_token?: string })?.reset_token ?? '';

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  // Guard: if no reset token in state, user reached here directly — send back
  if (!resetToken) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <Card elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: 400 }}>
          <Typography sx={{ mb: 2, color: '#334155' }}>
            Reset session expired or invalid. Please restart the password reset flow.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/forgot-password')} sx={{ background: '#2563eb' }}>
            Restart
          </Button>
        </Card>
      </Box>
    );
  }

  if (success) {
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
            border: '1px solid #e2e8f0', p: { xs: 4, sm: 6 }, textAlign: 'center',
          }}
        >
          <CheckCircleOutlinedIcon sx={{ fontSize: 56, color: '#22c55e', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            Password Reset!
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Your password has been updated successfully. You can now sign in with your new password.
          </Typography>
          <Button
            id="go-to-login-btn"
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate('/login', { replace: true })}
            sx={{
              py: 1.4, borderRadius: 2, fontWeight: 600,
              background: '#2563eb',
              '&:hover': { background: '#1d4ed8' },
            }}
          >
            Sign In
          </Button>
        </Card>
      </Box>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await resetPassword({
        reset_token: resetToken,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      }).unwrap();
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { data?: { detail?: { message?: string; code?: string } } };
      const code = apiErr?.data?.detail?.code;
      if (code === 'RESET_TOKEN_EXPIRED') {
        setServerError('Your reset session has expired. Please request a new code.');
      } else if (code === 'RESET_TOKEN_INVALID') {
        setServerError('Invalid or already used reset link. Please request a new code.');
      } else {
        setServerError(apiErr?.data?.detail?.message ?? 'Something went wrong. Please try again.');
      }
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mt: 1.5 }}>
            Set New Password
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
            Choose a strong password with uppercase, lowercase, digit, and a special character.
          </Typography>
        </Stack>

        <Box component="form" id="reset-password-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5}>
            {serverError && (
              <Alert id="reset-error-alert" severity="error" sx={{ borderRadius: 2 }}>
                {serverError}
              </Alert>
            )}

            {/* New Password */}
            <Box>
              <Typography
                component="label"
                htmlFor="new-password"
                sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                New Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
              </Typography>
              <TextField
                id="new-password"
                placeholder="••••••••"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                fullWidth
                {...register('new_password')}
                error={!!errors.new_password}
                helperText={errors.new_password?.message}
                slotProps={{
                  htmlInput: { 'aria-label': 'New Password' },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          id="toggle-new-password-visibility"
                          aria-label="toggle new password visibility"
                          onClick={() => setShowNew((v) => !v)}
                          edge="end"
                          size="small"
                          sx={{ color: '#94a3b8' }}
                        >
                          {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={inputStyle}
              />
            </Box>

            {/* Confirm Password */}
            <Box>
              <Typography
                component="label"
                htmlFor="confirm-password"
                sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Confirm Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
              </Typography>
              <TextField
                id="confirm-password"
                placeholder="••••••••"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                fullWidth
                {...register('confirm_password')}
                error={!!errors.confirm_password}
                helperText={errors.confirm_password?.message}
                slotProps={{
                  htmlInput: { 'aria-label': 'Confirm Password' },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          id="toggle-confirm-password-visibility"
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirm((v) => !v)}
                          edge="end"
                          size="small"
                          sx={{ color: '#94a3b8' }}
                        >
                          {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={inputStyle}
              />
            </Box>

            <Button
              id="reset-password-button"
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
              {isLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Reset Password'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                id="back-to-login-link"
                onClick={() => navigate('/login')}
                underline="hover"
                sx={{
                  fontSize: '0.875rem', fontWeight: 500, color: '#64748b',
                  cursor: 'pointer', border: 'none', background: 'none', p: 0,
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
    borderRadius: 2, background: '#ffffff', fontSize: '0.925rem', color: '#0f172a',
    '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: '#cbd5e1' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '2px' },
  },
  '& .MuiFormHelperText-root': { mx: 0.5 },
};
