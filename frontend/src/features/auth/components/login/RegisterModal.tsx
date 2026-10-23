import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../../hooks/useAuth';

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

export function RegisterModal({ open, onClose }: RegisterModalProps) {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } } };
      setServerError(
        apiErr?.data?.error?.message ?? 'Registration failed. Please try again.'
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            p: 1,
          },
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonAddIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Create an Account
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
              Join Fresher360 as a new user / fresher
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#94a3b8' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          <Stack spacing={2.5}>
            {serverError && (
              <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.875rem' }}>
                {serverError}
              </Alert>
            )}

            {/* Name fields in 2 columns */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  component="label"
                  htmlFor="register-first-name"
                  sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
                >
                  First Name <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                </Typography>
                <TextField
                  id="register-first-name"
                  placeholder="John"
                  fullWidth
                  autoFocus
                  {...register('first_name')}
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  slotProps={{
                    htmlInput: { 'aria-label': 'First Name' },
                  }}
                  sx={inputStyle}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  component="label"
                  htmlFor="register-last-name"
                  sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
                >
                  Last Name <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                </Typography>
                <TextField
                  id="register-last-name"
                  placeholder="Doe"
                  fullWidth
                  {...register('last_name')}
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  slotProps={{
                    htmlInput: { 'aria-label': 'Last Name' },
                  }}
                  sx={inputStyle}
                />
              </Box>
            </Box>

            {/* Email field */}
            <Box>
              <Typography
                component="label"
                htmlFor="register-email"
                sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Email Address <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
              </Typography>
              <TextField
                id="register-email"
                placeholder="you@example.com"
                type="email"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                slotProps={{
                  htmlInput: { 'aria-label': 'Email Address' },
                }}
                sx={inputStyle}
              />
            </Box>

            {/* Password field */}
            <Box>
              <Typography
                component="label"
                htmlFor="register-password"
                sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
              </Typography>
              <TextField
                id="register-password"
                placeholder="At least 6 characters"
                type={showPassword ? 'text' : 'password'}
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

            {/* Confirm Password field */}
            <Box>
              <Typography
                component="label"
                htmlFor="register-confirm-password"
                sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Confirm Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
              </Typography>
              <TextField
                id="register-confirm-password"
                placeholder="Re-enter your password"
                type={showConfirmPassword ? 'text' : 'password'}
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
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          edge="end"
                          size="small"
                          sx={{ color: '#94a3b8' }}
                        >
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={inputStyle}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1.5 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              color: '#64748b',
              borderColor: '#cbd5e1',
              borderRadius: 2,
              px: 3,
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{
              bgcolor: '#2563eb',
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            {isLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Create Account'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
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
