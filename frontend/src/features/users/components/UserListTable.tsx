import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { useGetUsersQuery, useUpdateUserRoleMutation } from '../api/usersApi';
import type { AdminUser, UserRoleType } from '../types/users.types';

interface UserListTableProps {
  onAddUser: () => void;
}

export function UserListTable({ onAddUser }: UserListTableProps) {
  const { data, isLoading, error, refetch } = useGetUsersQuery();
  const [updateUserRole] = useUpdateUserRoleMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const users = data?.data ?? [];

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return fullName.includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const handleRoleChange = async (userId: string, newRole: UserRoleType) => {
    setUpdatingUserId(userId);
    try {
      await updateUserRole({ userId, role: newRole }).unwrap();
      setSnackbarMessage(`Role updated to ${newRole} successfully`);
      setSnackbarSeverity('success');
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } } };
      setSnackbarMessage(apiErr?.data?.error?.message ?? 'Failed to update user role');
      setSnackbarSeverity('error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <Stack spacing={3}>
      {/* ── Header with Actions ── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Manage Users
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mt: 0.5 }}>
            View, assign roles, and manage all users registered in the database.
          </Typography>
        </Box>

        <Button
          id="add-user-btn"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddUser}
          sx={{
            background: '#2563eb',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            borderRadius: 2,
            px: 2.5,
            py: 1,
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { background: '#1d4ed8' },
          }}
        >
          Add User
        </Button>
      </Box>

      {/* ── Search Bar ── */}
      <Box sx={{ maxWidth: 400 }}>
        <TextField
          id="users-search-input"
          placeholder="Search by name, email, or role..."
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              background: '#ffffff',
              fontSize: '0.9rem',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#2563eb' },
            },
          }}
        />
      </Box>

      {/* ── Error Banner ── */}
      {error && (
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load users from the server. Please verify your database connection.
        </Alert>
      )}

      {/* ── Data Table Card ── */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ background: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.8 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.8 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.8 }}>Role (Control)</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.8 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Skeleton variant="circular" width={38} height={38} />
                        <Box sx={{ width: 140 }}>
                          <Skeleton variant="text" width="100%" height={20} />
                          <Skeleton variant="text" width="60%" height={16} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Skeleton variant="text" width={180} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 2 }} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 2 }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
                      <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                        No users found
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first user using the button above.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userItem) => (
                  <UserTableRow
                    key={userItem.id}
                    user={userItem}
                    isUpdating={updatingUserId === userItem.id}
                    onRoleChange={handleRoleChange}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── Feedback Snackbar ── */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarMessage(null)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

interface UserTableRowProps {
  user: AdminUser;
  isUpdating: boolean;
  onRoleChange: (userId: string, newRole: UserRoleType) => void;
}

function UserTableRow({ user, isUpdating, onRoleChange }: UserTableRowProps) {
  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U';

  const handleChange = (e: SelectChangeEvent<UserRoleType>) => {
    const newRole = e.target.value as UserRoleType;
    if (newRole !== user.role) {
      onRoleChange(user.id, newRole);
    }
  };

  const isRoleAdmin = user.role === 'ADMIN';

  return (
    <TableRow
      hover
      sx={{
        '&:last-child td, &:last-child th': { border: 0 },
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* ── User Column ── */}
      <TableCell sx={{ py: 1.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              fontSize: '0.875rem',
              fontWeight: 700,
              background: isRoleAdmin
                ? 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              boxShadow: isRoleAdmin
                ? '0 2px 8px rgba(79, 70, 229, 0.25)'
                : '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.925rem' }}>
              {user.first_name} {user.last_name}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              ID: {user.id.slice(0, 8)}...
            </Typography>
          </Box>
        </Box>
      </TableCell>

      {/* ── Email Column ── */}
      <TableCell sx={{ py: 1.8, color: '#334155', fontSize: '0.9rem' }}>
        {user.email}
      </TableCell>

      {/* ── Role Control Column ── */}
      <TableCell sx={{ py: 1.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Select<UserRoleType>
            value={user.role}
            onChange={handleChange}
            disabled={isUpdating}
            size="small"
            sx={{
              minWidth: 130,
              height: 34,
              fontSize: '0.825rem',
              fontWeight: 600,
              borderRadius: 2,
              background: isRoleAdmin ? '#f5f3ff' : '#eff6ff',
              color: isRoleAdmin ? '#5b21b6' : '#1e40af',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isRoleAdmin ? '#ddd6fe' : '#bfdbfe',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isRoleAdmin ? '#c4b5fd' : '#93c5fd',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isRoleAdmin ? '#7c3aed' : '#2563eb',
              },
            }}
          >
            <MenuItem value="ADMIN" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5b21b6' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettingsIcon sx={{ fontSize: 18 }} />
                ADMIN
              </Box>
            </MenuItem>
            <MenuItem value="USER" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 18 }} />
                USER (Fresher)
              </Box>
            </MenuItem>
          </Select>
          {isUpdating && <CircularProgress size={18} sx={{ color: '#2563eb' }} />}
        </Box>
      </TableCell>

      {/* ── Status Column ── */}
      <TableCell sx={{ py: 1.8 }}>
        <Chip
          label={user.is_active ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            bgcolor: user.is_active ? '#ecfdf5' : '#fef2f2',
            color: user.is_active ? '#059669' : '#dc2626',
            border: `1px solid ${user.is_active ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: 1.5,
          }}
        />
      </TableCell>
    </TableRow>
  );
}
