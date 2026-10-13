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
  Skeleton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, type SidebarNavOption } from '../../features/auth/components/DashboardLayout';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useGetTasksQuery, SubmitTaskModal, type Task } from '../../features/tasks';
import { useGetUserDashboardStatsQuery } from '../../features/dashboard';

interface UserHomePageProps {
  view?: 'dashboard' | 'tasks';
}

const userNavItems: SidebarNavOption[] = [
  { label: 'Dashboard', path: '/user', icon: <DashboardIcon /> },
  { label: 'My Tasks', path: '/user/tasks', icon: <AssignmentIcon /> },
];

export default function UserHomePage({ view = 'dashboard' }: UserHomePageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasksData, isLoading: isTasksLoading } = useGetTasksQuery();
  const { data: userStatsData, isLoading: isStatsLoading } = useGetUserDashboardStatsQuery();
  const stats = userStatsData?.data;

  const tasks = tasksData?.data ?? [];
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    setSelectedTask(null);
  }, [view]);

  const getProgress = (status: string, assessmentResult?: string) => {
    if (assessmentResult && !isNaN(Number(assessmentResult))) {
      return Math.min(100, Math.max(0, Number(assessmentResult)));
    }
    const s = status.toLowerCase();
    if (s === 'completed') return 100;
    if (s === 'in progress' || s === 'in review') return 50;
    return 0;
  };

  const getMyAssignment = (t: Task) => t.assigned_freshers?.find((f) => f.id === user?.id);

  const getMyStatus = (t: Task) => {
    const a = getMyAssignment(t);
    return (a?.status || t.status || 'Pending').toLowerCase();
  };

  const totalAssigned = stats?.total_assigned ?? tasks.length;

  const completedTasks = tasks.filter((t) => getMyStatus(t) === 'completed');
  const completedTasksCount = stats?.completed_tasks ?? completedTasks.length;

  const inProgressTasks = tasks.filter((t) => getMyStatus(t) === 'in progress');
  const inProgressTasksCount = stats?.in_progress_tasks ?? inProgressTasks.length;

  const pendingTasks = tasks.filter((t) => getMyStatus(t) === 'pending');
  const pendingTasksCount = stats?.pending_tasks ?? pendingTasks.length;

  const inReviewTasks = tasks.filter((t) => {
    const s = getMyStatus(t);
    const a = getMyAssignment(t);
    return (
      s === 'in review' ||
      (s === 'completed' && (a?.assessment_status || 'Pending').toLowerCase() === 'pending')
    );
  });
  const inReviewTasksCount = stats?.in_review_tasks ?? inReviewTasks.length;

  const completionRate =
    stats?.completion_rate ??
    (totalAssigned > 0 ? Math.round((completedTasksCount / totalAssigned) * 100) : 0);

  const gradedTasks = tasks.filter((t) => {
    const a = getMyAssignment(t);
    return a?.assessment_result && !isNaN(Number(a.assessment_result));
  });

  const averageScore =
    stats?.average_score !== undefined
      ? stats.average_score
      : gradedTasks.length > 0
      ? Number(
          (
            gradedTasks.reduce(
              (acc, t) => acc + Number(getMyAssignment(t)!.assessment_result),
              0
            ) / gradedTasks.length
          ).toFixed(1)
        )
      : null;

  const passedCount =
    stats?.passed_count ??
    tasks.filter((t) => (getMyAssignment(t)?.assessment_status || '').toLowerCase() === 'passed').length;

  const dueSoonTasks = tasks.filter((t) => {
    if (!t.due_date || getMyStatus(t) === 'completed') return false;
    const due = new Date(t.due_date).getTime();
    const now = new Date().getTime();
    const diff = (due - now) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 7;
  });

  const statusLabel =
    completionRate >= 80
      ? 'Excellent Progress'
      : completionRate >= 50
      ? 'On Track'
      : totalAssigned === 0
      ? 'All Caught Up'
      : 'Action Needed';

  const statusColor: 'success' | 'info' | 'default' | 'warning' =
    completionRate >= 80
      ? 'success'
      : completionRate >= 50
      ? 'info'
      : totalAssigned === 0
      ? 'default'
      : 'warning';

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
          {/* Welcome Header */}
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
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Welcome, {user?.first_name}! 🚀
              </Typography>
              <Typography sx={{ color: '#64748b', mt: 0.5 }}>
                Track your onboarding deliverables, task progress, and mentor evaluations live.
              </Typography>
            </Box>
            <Chip
              icon={<TrendingUpIcon />}
              label={statusLabel}
              color={statusColor}
              size="medium"
              sx={{ fontWeight: 700, px: 1 }}
            />
          </Box>

          {/* Quick Stats Grid */}
          <Grid container spacing={3}>
            {isTasksLoading && isStatsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Skeleton variant="text" width="50%" height={24} />
                    <Skeleton variant="text" width="80%" height={48} />
                    <Skeleton variant="text" width="60%" height={20} />
                  </Card>
                </Grid>
              ))
            ) : (
              [
                {
                  label: 'Assigned Tasks',
                  value: `${totalAssigned}`,
                  icon: <AssignmentIcon />,
                  color: '#2563eb',
                  bg: '#eff6ff',
                  change: `${inProgressTasksCount} in progress • ${pendingTasksCount} pending`,
                  action: () => navigate('/user/tasks'),
                },
                {
                  label: 'Completed',
                  value: `${completedTasksCount}`,
                  icon: <CheckCircleIcon />,
                  color: '#059669',
                  bg: '#ecfdf5',
                  change: `${completionRate}% overall completion`,
                  action: () => navigate('/user/tasks'),
                },
                {
                  label: 'Pending Review',
                  value: `${inReviewTasksCount}`,
                  icon: <PendingActionsIcon />,
                  color: '#d97706',
                  bg: '#fffbeb',
                  change:
                    dueSoonTasks.length > 0
                      ? `${dueSoonTasks.length} milestone(s) due this week`
                      : inReviewTasksCount > 0
                      ? 'Awaiting mentor review'
                      : 'No deliverables pending review',
                  action: () => navigate('/user/tasks'),
                },
                {
                  label: 'Performance / Score',
                  value: averageScore !== null ? `${averageScore}%` : passedCount > 0 ? `${passedCount} Passed` : 'N/A',
                  icon: <EmojiEventsIcon />,
                  color: '#8b5cf6',
                  bg: '#f5f3ff',
                  change:
                    gradedTasks.length > 0
                      ? `${passedCount} passed • ${gradedTasks.length} evaluated`
                      : passedCount > 0
                      ? `${passedCount} milestone passed`
                      : 'Awaiting first milestone grade',
                  action: () => navigate('/user/tasks'),
                },
              ].map((stat) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                  <Card
                    elevation={0}
                    onClick={stat.action}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)',
                        transform: 'translateY(-2px)',
                        borderColor: stat.color,
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
              ))
            )}
          </Grid>

          {/* Overall Onboarding Progress Banner */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Overall Onboarding Milestone Progress
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {totalAssigned === 0
                    ? 'No milestones assigned yet.'
                    : `${completedTasksCount} of ${totalAssigned} tasks completed (${completionRate}%)`}
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563eb' }}>
                {completionRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionRate}
              sx={{ height: 10, borderRadius: 5, bgcolor: '#f1f5f9', mb: 2 }}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`${completedTasksCount} Completed`} size="small" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 600 }} />
              <Chip label={`${inProgressTasksCount} In Progress`} size="small" sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 600 }} />
              <Chip label={`${pendingTasksCount} Pending`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
              <Chip label={`${inReviewTasksCount} In Review`} size="small" sx={{ bgcolor: '#fffbeb', color: '#d97706', fontWeight: 600 }} />
            </Stack>
          </Card>

          {/* Current Sprint Progress & Deliverables */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Current Sprint Deliverables & Tasks
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Click any task to submit work, view reference documents, or check mentor evaluation.
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => navigate('/user/tasks')}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#2563eb' }}
              >
                View All ({tasks.length})
              </Button>
            </Box>

            <Stack spacing={2.5}>
              {tasks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mb: 1, fontWeight: 600 }}>
                    No tasks assigned currently.
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    You are all caught up! When supervisors assign modules and milestones, they will appear here.
                  </Typography>
                </Box>
              ) : (
                tasks.slice(0, 4).map((task) => {
                  const myAssgn = task.assigned_freshers?.find((f) => f.id === user?.id);
                  const myStatus = myAssgn?.status || task.status;
                  const isCompleted = myStatus.toLowerCase() === 'completed';
                  const progressValue = getProgress(myStatus, myAssgn?.assessment_result);

                  return (
                    <Box
                      key={task.id}
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: '#f1f5f9',
                          borderColor: '#cbd5e1',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ flex: 1, pr: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: '#2563eb', fontSize: '0.85rem' }}>
                              {task.code}
                            </Typography>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color: '#0f172a',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                '&:hover': { color: '#2563eb', textDecoration: 'underline' },
                              }}
                              onClick={() => setSelectedTask(task)}
                            >
                              {task.title}
                            </Typography>
                          </Box>

                          {task.description && (
                            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.5, lineClamp: 2 }}>
                              {task.description}
                            </Typography>
                          )}

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

                          {(myAssgn?.comments || task.comments) && (
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                color: '#b45309',
                                bgcolor: '#fffbeb',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                display: 'inline-block',
                                mt: 0.75,
                                border: '1px solid #fef3c7',
                              }}
                            >
                              💬 Mentor Note: {myAssgn?.comments || task.comments}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Chip
                            label={myStatus}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              bgcolor: isCompleted ? '#ecfdf5' : '#eff6ff',
                              color: isCompleted ? '#059669' : '#2563eb',
                            }}
                          />
                          {myAssgn?.assessment_status && (
                            <Chip
                              label={`Eval: ${myAssgn.assessment_status}`}
                              size="small"
                              variant="outlined"
                              color={
                                myAssgn.assessment_status === 'Passed'
                                  ? 'success'
                                  : myAssgn.assessment_status === 'Failed'
                                  ? 'error'
                                  : 'default'
                              }
                              sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSelectedTask(task)}
                            sx={{
                              borderRadius: 2,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            {isCompleted ? 'View Details' : 'Submit Work'}
                          </Button>
                        </Stack>
                      </Box>

                      <Box sx={{ mt: 1.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progressValue}
                          sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', my: 1 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Module: {task.category} • Priority: {task.priority}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                            {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : 'No Due Date'} • Progress: {progressValue}%
                          </Typography>
                        </Box>
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

