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
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { useCreateUserMutation } from '../api/usersApi';
import type { UserRoleType } from '../types/users.types';

const createUserSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'USER']),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddUserModal({ open, onClose }: AddUserModalProps) {
  const [createUser, { isLoading }] = useCreateUserMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'USER',
    },
  });

  const selectedRole = watch('role');

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: CreateUserFormValues) => {
    setServerError(null);
    try {
      await createUser({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        role: data.role as UserRoleType,
      }).unwrap();
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } } };
      setServerError(
        apiErr?.data?.error?.message ?? 'Failed to create user. Please try again.'
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
              Add New User
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
              Create an account with either Admin or Fresher permissions
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

            {/* ── First & Last Name ── */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  component="label"
                  htmlFor="add-first-name"
                  sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
                >
                  First Name
                </Typography>
                <TextField
                  id="add-first-name"
                  placeholder="e.g. Alex"
                  fullWidth
                  autoFocus
                  {...register('first_name')}
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  sx={inputStyle}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  component="label"
                  htmlFor="add-last-name"
                  sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
                >
                  Last Name
                </Typography>
                <TextField
                  id="add-last-name"
                  placeholder="e.g. Miller"
                  fullWidth
                  {...register('last_name')}
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  sx={inputStyle}
                />
              </Box>
            </Box>

            {/* ── Email ── */}
            <Box>
              <Typography
                component="label"
                htmlFor="add-user-email"
                sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Email Address
              </Typography>
              <TextField
                id="add-user-email"
                placeholder="alex.miller@fresher360.com"
                type="email"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={inputStyle}
              />
            </Box>

            {/* ── Password ── */}
            <Box>
              <Typography
                component="label"
                htmlFor="add-user-password"
                sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Initial Password
              </Typography>
              <TextField
                id="add-user-password"
                placeholder="Temporary password (min 6 chars)"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{
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

            {/* ── Role Selector ── */}
            <Box>
              <Typography
                component="label"
                htmlFor="add-user-role-select"
                sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', mb: 0.75 }}
              >
                Assign Role
              </Typography>
              <FormControl fullWidth>
                <Select
                  id="add-user-role-select"
                  value={selectedRole}
                  onChange={(e) => setValue('role', e.target.value as 'ADMIN' | 'USER')}
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.925rem',
                    fontWeight: 600,
                    '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '2px' },
                  }}
                >
                  <MenuItem value="USER" sx={{ py: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PersonIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                          USER (Fresher)
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Standard portal access: view dashboard, take tasks, view progress
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="ADMIN" sx={{ py: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AdminPanelSettingsIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                          ADMIN
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Full platform administrative access: manage users, assign roles, manage tasks
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
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
              textTransform: 'none',
              fontWeight: 600,
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
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            {isLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Create User'}
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
