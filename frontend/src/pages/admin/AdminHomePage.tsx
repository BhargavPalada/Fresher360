import { useState } from 'react';
import {
  Box,
  Card,
  Grid,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import { DashboardLayout, type SidebarNavOption } from '../../features/auth/components/DashboardLayout';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { UserListTable, AddUserModal, useGetUsersQuery } from '../../features/users';

interface AdminHomePageProps {
  view?: 'dashboard' | 'users' | 'freshers' | 'tasks';
}

const adminNavItems: SidebarNavOption[] = [
  { label: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { label: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'Tasks', path: '/admin/tasks', icon: <AssignmentIcon /> },
];

const mockTasks = [
  { id: 'TSK-101', title: 'Complete Auth Module Integration', assignedTo: 'John Doe', priority: 'High', status: 'In Progress', due: 'Tomorrow' },
  { id: 'TSK-102', title: 'Implement Dashboard Responsive Grid', assignedTo: 'Sarah Jenkins', priority: 'Medium', status: 'Completed', due: 'Sep 18' },
  { id: 'TSK-103', title: 'Database Migration Scripts Validation', assignedTo: 'Rohan Sharma', priority: 'Urgent', status: 'In Review', due: 'Today' },
  { id: 'TSK-104', title: 'API Unit Tests & Coverage Report', assignedTo: 'Emily Chen', priority: 'Low', status: 'Pending', due: 'Sep 22' },
];

export default function AdminHomePage({ view = 'dashboard' }: AdminHomePageProps) {
  const { user } = useAuth();
  const { data: usersData } = useGetUsersQuery();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const recentUsers = usersData?.data?.slice(0, 4) ?? [];

  const getTitle = () => {
    switch (view) {
      case 'users':
      case 'freshers':
        return 'Users Management';
      case 'tasks':
        return 'Task Management';
      default:
        return 'Admin Dashboard';
    }
  };

  return (
    <DashboardLayout title={getTitle()} roleBadge="ADMIN" navItems={adminNavItems}>
      {/* ── View: Users ── */}
      {(view === 'users' || view === 'freshers') && (
        <>
          <UserListTable onAddUser={() => setIsAddUserOpen(true)} />
          <AddUserModal
            open={isAddUserOpen}
            onClose={() => setIsAddUserOpen(false)}
          />
        </>
      )}

      {/* ── View: Tasks ── */}
      {view === 'tasks' && (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Fresher Tasks
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                Assign and monitor technical milestone tasks for freshers.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                background: '#2563eb',
                boxShadow: 'none',
                borderRadius: 2,
                '&:hover': { background: '#1d4ed8' },
              }}
            >
              Create Task
            </Button>
          </Box>

          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Task ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockTasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#2563eb' }}>{task.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{task.title}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{task.assignedTo}</TableCell>
                      <TableCell>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: task.priority === 'Urgent' || task.priority === 'High' ? '#fef2f2' : '#f1f5f9',
                            color: task.priority === 'Urgent' || task.priority === 'High' ? '#dc2626' : '#475569',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.status}
                          size="small"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: task.status === 'Completed' ? '#ecfdf5' : '#eff6ff',
                            color: task.status === 'Completed' ? '#059669' : '#2563eb',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{task.due}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      )}

      {/* ── View: Dashboard (Default) ── */}
      {view === 'dashboard' && (
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Welcome back, {user?.first_name}! 👋
            </Typography>
            <Typography sx={{ color: '#64748b', mt: 0.5 }}>
              Here is an overview of Fresher360 platform activity today.
            </Typography>
          </Box>

          {/* Stat Cards */}
          <Grid container spacing={3}>
            {[
              { label: 'Total Freshers', value: '48', icon: <PeopleIcon />, color: '#2563eb', bg: '#eff6ff', change: '+12% this cohort' },
              { label: 'Active Tasks', value: '24', icon: <AssignmentIcon />, color: '#6366f1', bg: '#eef2ff', change: '8 due this week' },
              { label: 'Completion Rate', value: '92%', icon: <CheckCircleIcon />, color: '#059669', bg: '#ecfdf5', change: '+4% vs last sprint' },
              { label: 'Average Score', value: '88.5', icon: <TrendingUpIcon />, color: '#d97706', bg: '#fffbeb', change: 'Top quartile' },
            ].map((stat) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                <Card
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', my: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: stat.color }}>
                        {stat.change}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        background: stat.bg,
                        color: stat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Quick Tables Section */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                  Recent Users
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                            No users registered yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentUsers.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>
                              {row.first_name} {row.last_name}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row.role}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  bgcolor: row.role === 'ADMIN' ? '#f5f3ff' : '#eff6ff',
                                  color: row.role === 'ADMIN' ? '#5b21b6' : '#2563eb',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row.is_active ? 'Active' : 'Inactive'}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  bgcolor: row.is_active ? '#ecfdf5' : '#fef2f2',
                                  color: row.is_active ? '#059669' : '#dc2626',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                  High Priority Tasks
                </Typography>
                <Stack spacing={2}>
                  {mockTasks.slice(0, 3).map((task) => (
                    <Box key={task.id} sx={{ p: 1.5, borderRadius: 2, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                          {task.title}
                        </Typography>
                        <Chip label={task.priority} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fef2f2', color: '#dc2626' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Assigned to: {task.assignedTo} • Due {task.due}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
    </DashboardLayout>
  );
}

