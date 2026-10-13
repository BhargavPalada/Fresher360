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
import { useState } from 'react';
import { DashboardLayout, type SidebarNavOption } from '../../features/auth/components/DashboardLayout';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useGetTasksQuery, SubmitTaskModal, type Task } from '../../features/tasks';

interface UserHomePageProps {
  view?: 'dashboard' | 'tasks';
}

const userNavItems: SidebarNavOption[] = [
  { label: 'Dashboard', path: '/user', icon: <DashboardIcon /> },
  { label: 'My Tasks', path: '/user/tasks', icon: <AssignmentIcon /> },
];

export default function UserHomePage({ view = 'dashboard' }: UserHomePageProps) {
  const { user } = useAuth();
  const { data: tasksData, isLoading: isTasksLoading } = useGetTasksQuery();
  const tasks = tasksData?.data ?? [];
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const getProgress = (status: string, assessmentResult?: string) => {
    if (assessmentResult && !isNaN(Number(assessmentResult))) {
      return Math.min(100, Math.max(0, Number(assessmentResult)));
    }
    const s = status.toLowerCase();
    if (s === 'completed') return 100;
    if (s === 'in progress' || s === 'in review') return 50;
    return 0;
  };

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
                  {isTasksLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                        Loading your tasks...
                      </TableCell>
                    </TableRow>
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                        No tasks assigned yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => {
                      const myAssignment = task.assigned_freshers.find((f) => f.id === user?.id);
                      const myStatus = myAssignment?.status || task.status;
                      const isCompleted = myStatus.toLowerCase() === 'completed';

                      return (
                        <TableRow key={task.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                            {task.code}
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                color: '#0f172a',
                                cursor: 'pointer',
                                '&:hover': { color: '#2563eb', textDecoration: 'underline' },
                              }}
                              onClick={() => setSelectedTask(task)}
                            >
                              {task.title}
                            </Typography>
                            {task.attachment_url && (
                              <Box sx={{ mt: 0.5 }}>
                                <a
                                  href={task.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#2563eb',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                  }}
                                >
                                  {task.attachment_url.startsWith('http')
                                    ? '🔗 Open Reference Link'
                                    : '📎 Download Reference Document'}
                                </a>
                              </Box>
                            )}
                            {(myAssignment?.comments || task.comments) && (
                              <Typography
                                sx={{
                                  fontSize: '0.75rem',
                                  color: '#b45309',
                                  bgcolor: '#fffbeb',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  display: 'inline-block',
                                  mt: 0.5,
                                  border: '1px solid #fef3c7',
                                }}
                              >
                                💬 Note: {myAssignment?.comments || task.comments}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ color: '#64748b' }}>{task.category}</TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={getProgress(myStatus, myAssignment?.assessment_result)}
                                sx={{ flexGrow: 1, height: 6, borderRadius: 3, bgcolor: '#f1f5f9' }}
                              />
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                {getProgress(myStatus, myAssignment?.assessment_result)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Chip
                                label={myStatus}
                                size="small"
                                sx={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: isCompleted ? '#ecfdf5' : '#eff6ff',
                                  color: isCompleted ? '#059669' : '#2563eb',
                                }}
                              />
                              {myAssignment?.assessment_status && (
                                <Chip
                                  label={`Eval: ${myAssignment.assessment_status}`}
                                  size="small"
                                  variant="outlined"
                                  color={
                                    myAssignment.assessment_status === 'Passed'
                                      ? 'success'
                                      : myAssignment.assessment_status === 'Failed'
                                      ? 'error'
                                      : 'default'
                                  }
                                  sx={{ fontSize: '0.65rem', height: 18, fontWeight: 600 }}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setSelectedTask(task)}
                              sx={{
                                borderRadius: 1.5,
                                fontSize: '0.75rem',
                                textTransform: 'none',
                              }}
                            >
                              {isCompleted ? 'View Details' : 'Submit Work'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
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
              {tasks.length === 0 ? (
                <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>No tasks assigned currently.</Typography>
              ) : (
                tasks.slice(0, 3).map((task) => {
                  const myAssgn = task.assigned_freshers?.find((f) => f.id === user?.id);
                  const progressValue = getProgress(myAssgn?.status || task.status, myAssgn?.assessment_result);

                  return (
                    <Box key={task.id} sx={{ p: 2, borderRadius: 2, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontWeight: 600, color: '#0f172a' }}>
                          {task.title}
                        </Typography>
                        <Chip
                          label={myAssgn?.status || task.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor: (myAssgn?.status || task.status)?.toLowerCase() === 'completed' ? '#ecfdf5' : '#eff6ff',
                            color: (myAssgn?.status || task.status)?.toLowerCase() === 'completed' ? '#059669' : '#2563eb',
                          }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progressValue}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', my: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Module: {task.category}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Progress: {progressValue}%
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Stack>
          </Card>
        </Stack>
      )}

      <SubmitTaskModal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={tasks.find((t) => t.id === selectedTask?.id) ?? selectedTask}
      />
    </DashboardLayout>
  );
}

