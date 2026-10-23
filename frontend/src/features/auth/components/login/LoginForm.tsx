import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../hooks/useAuth';
import { RegisterModal } from './RegisterModal';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login({ email: data.email, password: data.password });
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
        'Login failed. Please check your credentials and try again.';
      setServerError(message);
    }
  };

  return (
    <Box
      component="form"
      id="login-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ width: '100%' }}
    >
      <Stack spacing={2.5}>
        {serverError && (
          <Alert
            id="login-error-alert"
            severity="error"
            sx={{
              borderRadius: 2,
              fontSize: '0.875rem',
            }}
          >
            {serverError}
          </Alert>
        )}

        <Box>
          <Typography
            component="label"
            htmlFor="login-email"
            sx={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#334155',
              mb: 0.75,
            }}
          >
            Email <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
          </Typography>
          <TextField
            id="login-email"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            autoFocus
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            slotProps={{
              htmlInput: { 'aria-label': 'Email' },
            }}
            sx={inputStyle}
          />
        </Box>

        <Box>
          <Typography
            component="label"
            htmlFor="login-password"
            sx={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#334155',
              mb: 0.75,
            }}
          >
            Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
          </Typography>
          <TextField
            id="login-password"
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            slotProps={{
              htmlInput: { 'aria-label': 'Password' },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      id="toggle-password-visibility"
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                      sx={{ color: '#94a3b8' }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={inputStyle}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: -0.5,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                size="small"
                sx={{
                  color: '#cbd5e1',
                  '&.Mui-checked': { color: '#2563eb' },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                Remember me
              </Typography>
            }
          />

          <Link
            component="button"
            type="button"
            id="forgot-password-link"
            onClick={() => navigate('/forgot-password')}
            underline="hover"
            sx={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#2563eb',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              p: 0,
            }}
          >
            Forgot Password?
          </Link>
        </Box>

        <Button
          id="login-submit-button"
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
            '&:hover': {
              background: '#1d4ed8',
              boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
            },
            '&:disabled': {
              background: '#94a3b8',
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={22} sx={{ color: 'white' }} />
          ) : (
            'Sign In'
          )}
        </Button>

        <Box sx={{ textAlign: 'center', pt: 0.5 }}>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
            New user?{' '}
            <Link
              component="button"
              type="button"
              id="open-register-modal-btn"
              onClick={() => setIsRegisterOpen(true)}
              underline="hover"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#2563eb',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                p: 0,
                verticalAlign: 'baseline',
              }}
            >
              Register here
            </Link>
          </Typography>
        </Box>
      </Stack>

      <RegisterModal
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </Box>
  );
}

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    background: '#ffffff',
    fontSize: '0.925rem',
    color: '#0f172a',
    '& fieldset': {
      borderColor: '#e2e8f0',
      borderWidth: '1.5px',
    },
    '&:hover fieldset': {
      borderColor: '#cbd5e1',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2563eb',
      borderWidth: '2px',
    },
  },
  '& .MuiFormHelperText-root': {
    mx: 0.5,
  },
};
