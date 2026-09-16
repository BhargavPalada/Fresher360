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
  LinearProgress,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { DashboardLayout, type SidebarNavOption } from '../../features/auth/components/DashboardLayout';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface UserHomePageProps {
  view?: 'dashboard' | 'tasks';
}

const userNavItems: SidebarNavOption[] = [
  { label: 'Dashboard', path: '/user', icon: <DashboardIcon /> },
  { label: 'My Tasks', path: '/user/tasks', icon: <AssignmentIcon /> },
];

const mockUserTasks = [
  { id: 'TSK-101', title: 'Complete Auth Module Integration', module: 'Sprint 1', priority: 'High', status: 'In Progress', progress: 65, due: 'Tomorrow' },
  { id: 'TSK-105', title: 'REST API Best Practices Review', module: 'Foundation', priority: 'Medium', status: 'Completed', progress: 100, due: 'Completed' },
  { id: 'TSK-108', title: 'Database Schema Normalization Quiz', module: 'Database', priority: 'Urgent', status: 'Pending', progress: 20, due: 'Sep 20' },
  { id: 'TSK-112', title: 'State Management with Redux Toolkit', module: 'Frontend', priority: 'Medium', status: 'Pending', progress: 0, due: 'Sep 24' },
];

export default function UserHomePage({ view = 'dashboard' }: UserHomePageProps) {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title={view === 'tasks' ? 'My Assigned Tasks' : 'Fresher Dashboard'}
      roleBadge="FRESHER"
      navItems={userNavItems}
    >
      {/* ── View: Tasks ── */}
      {view === 'tasks' && (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Assigned Milestones & Tasks
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                Track your weekly deliverables and mark tasks as ready for mentor review.
              </Typography>
            </Box>
          </Box>

          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Task ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Task Description</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Module</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Progress</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Due Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockUserTasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#2563eb' }}>{task.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{task.title}</TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{task.module}</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={task.progress}
                            sx={{ flexGrow: 1, height: 6, borderRadius: 3, bgcolor: '#f1f5f9' }}
                          />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                            {task.progress}%
                          </Typography>
                        </Box>
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
                      <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>{task.due}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={task.status === 'Completed'}
                          sx={{
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                          }}
                        >
                          {task.status === 'Completed' ? 'Submitted' : 'Submit Work'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      )}

      {/* ── View: Dashboard ── */}
      {view === 'dashboard' && (
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Welcome, {user?.first_name}! 🚀
            </Typography>
            <Typography sx={{ color: '#64748b', mt: 0.5 }}>
              Track your onboarding milestones, tasks, and mentor feedback.
            </Typography>
          </Box>

          {/* Quick Stats Grid */}
          <Grid container spacing={3}>
            {[
              { label: 'Assigned Tasks', value: '4', icon: <AssignmentIcon />, color: '#2563eb', bg: '#eff6ff', change: '1 in progress' },
              { label: 'Completed', value: '1', icon: <CheckCircleIcon />, color: '#059669', bg: '#ecfdf5', change: '25% completion' },
              { label: 'Pending Review', value: '2', icon: <PendingActionsIcon />, color: '#d97706', bg: '#fffbeb', change: 'Due this week' },
              { label: 'Cohort Rank', value: '#6', icon: <EmojiEventsIcon />, color: '#8b5cf6', bg: '#f5f3ff', change: 'Top 15%' },
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

          {/* Active Tasks Overview */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Current Sprint Progress
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Tasks currently assigned to you for evaluation.
                </Typography>
              </Box>
              <Chip
                icon={<TrendingUpIcon />}
                label="On Track"
                color="success"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Stack spacing={2.5}>
              {mockUserTasks.slice(0, 3).map((task) => (
                <Box key={task.id} sx={{ p: 2, borderRadius: 2, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {task.title}
                    </Typography>
                    <Chip
                      label={task.status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        bgcolor: task.status === 'Completed' ? '#ecfdf5' : '#eff6ff',
                        color: task.status === 'Completed' ? '#059669' : '#2563eb',
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={task.progress}
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', my: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Module: {task.module}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Due: {task.due}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Stack>
      )}
    </DashboardLayout>
  );
}

