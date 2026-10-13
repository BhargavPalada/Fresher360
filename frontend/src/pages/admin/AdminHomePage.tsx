import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CategoryIcon from '@mui/icons-material/Category';
import { DashboardLayout, type SidebarNavOption } from '../../features/auth/components/DashboardLayout';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { UserListTable, AddUserModal, useGetUsersQuery } from '../../features/users';
import {
  CreateTaskModal,
  EditTaskModal,
  UserProgressModal,
  useGetTasksQuery,
  useDeleteTaskMutation,
  type Task,
} from '../../features/tasks';
import { useGetAdminDashboardStatsQuery } from '../../features/dashboard';

interface AdminHomePageProps {
  view?: 'dashboard' | 'users' | 'freshers' | 'tasks';
}

const adminNavItems: SidebarNavOption[] = [
  { label: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { label: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'Tasks', path: '/admin/tasks', icon: <AssignmentIcon /> },
];

export default function AdminHomePage({ view = 'dashboard' }: AdminHomePageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery();
  const { data: dashboardStatsData, isLoading: isDashboardLoading } = useGetAdminDashboardStatsQuery();
  const apiStats = dashboardStatsData?.data;

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: tasksData, isLoading: isTasksLoading } = useGetTasksQuery(
    view === 'tasks'
      ? {
          search: searchTerm.trim() || undefined,
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
          status: statusFilter || undefined,
        }
      : undefined
  );

  const [deleteTask] = useDeleteTaskMutation();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [progressTask, setProgressTask] = useState<Task | null>(null);

  useEffect(() => {
    setIsCreateTaskOpen(false);
    setIsAddUserOpen(false);
    setEditingTask(null);
    setProgressTask(null);
  }, [view]);

  const allUsers = usersData?.data ?? [];
  const freshers = allUsers.filter((u) => u.role === 'USER');
  const activeFreshers = freshers.filter((u) => u.is_active);
  const totalFreshersCount = apiStats?.total_freshers ?? freshers.length;
  const activeFreshersCount = apiStats?.active_freshers ?? activeFreshers.length;
  const totalAdminsCount = apiStats?.total_admins ?? allUsers.filter((u) => u.role === 'ADMIN').length;

  const tasks = tasksData?.data ?? [];
  const totalTasksCount = apiStats?.total_tasks ?? tasks.length;
  const completedTasks = tasks.filter((t) => t.status?.toLowerCase() === 'completed');
  const completedTasksCount = apiStats?.completed_tasks ?? completedTasks.length;
  const activeTasks = tasks.filter((t) => t.status?.toLowerCase() !== 'completed');
  const activeTasksCount = apiStats?.active_tasks ?? activeTasks.length;

  const allAssignments = tasks.flatMap((t) => t.assigned_freshers || []);
  const totalAssignmentsCount = apiStats?.total_assignments ?? allAssignments.length;
  const completedAssignments = allAssignments.filter(
    (a) => a.status?.toLowerCase() === 'completed'
  );
  const completedAssignmentsCount =
    apiStats?.completed_assignments ?? completedAssignments.length;

  const completionRate =
    apiStats?.completion_rate ??
    (totalAssignmentsCount > 0
      ? Math.round((completedAssignmentsCount / totalAssignmentsCount) * 100)
      : totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0);

  const gradedAssignments = allAssignments.filter(
    (a) => a.assessment_result && !isNaN(Number(a.assessment_result))
  );
  const averageScore =
    apiStats?.average_score !== undefined
      ? apiStats.average_score
      : gradedAssignments.length > 0
      ? Number(
          (
            gradedAssignments.reduce((acc, a) => acc + Number(a.assessment_result), 0) /
            gradedAssignments.length
          ).toFixed(1)
        )
      : null;

  const passedCount =
    apiStats?.passed_count ??
    allAssignments.filter((a) => a.assessment_status?.toLowerCase() === 'passed').length;

  const pendingEvaluationsCount =
    apiStats?.pending_evaluations ??
    allAssignments.filter(
      (a) =>
        a.status?.toLowerCase() === 'in review' ||
        (a.status?.toLowerCase() === 'completed' &&
          (a.assessment_status || 'Pending').toLowerCase() === 'pending')
    ).length;

  const recentUsers = allUsers.slice(0, 5);
  const recentTasks = tasks.slice(0, 4);

  const categoryCounts: Record<string, number> =
    apiStats?.category_counts ??
    tasks.reduce<Record<string, number>>((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

  const priorityCounts: Record<string, number> =
    apiStats?.priority_counts ??
    tasks.reduce<Record<string, number>>((acc, t) => {
      const prio = t.priority || 'Medium';
      acc[prio] = (acc[prio] || 0) + 1;
      return acc;
    }, {});

  const handleDeleteTask = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete task "${task.title}" (${task.code})?`)) {
      try {
        await deleteTask(task.id).unwrap();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

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
          <AddUserModal open={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} />
        </>
      )}

      {/* ── View: Tasks ── */}
      {view === 'tasks' && (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Task Management
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                Create, assign, evaluate milestones, and track user-wise progress.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateTaskOpen(true)}
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

          {/* Search & Filter Toolbar */}
          <Card elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2.5, bgcolor: '#ffffff' }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  placeholder="Search by title, description, or fresher..."
                  size="small"
                  fullWidth
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                <TextField
                  select
                  label="Category"
                  size="small"
                  fullWidth
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Technical">Technical</MenuItem>
                  <MenuItem value="Training">Training</MenuItem>
                  <MenuItem value="Functional">Functional</MenuItem>
                  <MenuItem value="Documentation">Documentation</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                <TextField
                  select
                  label="Priority"
                  size="small"
                  fullWidth
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                <TextField
                  select
                  label="Status"
                  size="small"
                  fullWidth
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </TextField>
              </Grid>

              {(searchTerm || categoryFilter || priorityFilter || statusFilter) && (
                <Grid size={{ xs: 12, md: 'auto' }}>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('');
                      setPriorityFilter('');
                      setStatusFilter('');
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              )}
            </Grid>
          </Card>

          {/* Tasks Table */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Task ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Title & Category</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Assigned Freshers</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>User Progress</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Due Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isTasksLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                        Loading tasks...
                      </TableCell>
                    </TableRow>
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                        No tasks match the selected criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => {
                      const completedCount = task.assigned_freshers.filter(
                        (f) => f.status?.toLowerCase() === 'completed'
                      ).length;
                      const totalCount = task.assigned_freshers.length;

                      return (
                        <TableRow key={task.id} hover>
                          <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>{task.code}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                              {task.title}
                            </Typography>
                            <Chip
                              label={task.category}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: '#f1f5f9',
                                color: '#475569',
                                mt: 0.5,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={task.priority}
                              size="small"
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background:
                                  task.priority?.toLowerCase() === 'high'
                                    ? '#fef2f2'
                                    : task.priority?.toLowerCase() === 'medium'
                                    ? '#fffbeb'
                                    : '#f1f5f9',
                                color:
                                  task.priority?.toLowerCase() === 'high'
                                    ? '#dc2626'
                                    : task.priority?.toLowerCase() === 'medium'
                                    ? '#d97706'
                                    : '#475569',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {task.assigned_freshers.length === 0 ? (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Unassigned
                              </Typography>
                            ) : (
                              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                {task.assigned_freshers.map((f) => (
                                  <Chip
                                    key={f.id}
                                    label={`${f.first_name} ${f.last_name}`}
                                    size="small"
                                    variant="outlined"
                                    color={f.status?.toLowerCase() === 'completed' ? 'success' : 'default'}
                                    sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${completedCount}/${totalCount} Completed`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                background:
                                  totalCount > 0 && completedCount === totalCount
                                    ? '#ecfdf5'
                                    : '#eff6ff',
                                color:
                                  totalCount > 0 && completedCount === totalCount
                                    ? '#059669'
                                    : '#2563eb',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                              <Tooltip title="View User Progress & Evaluation">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => setProgressTask(task)}
                                  sx={{ bgcolor: '#eff6ff' }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Task Details">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => setEditingTask(task)}
                                  sx={{ bgcolor: '#f0f9ff' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Task">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteTask(task)}
                                  sx={{ bgcolor: '#fef2f2' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Modals */}
          <CreateTaskModal open={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} />

          <EditTaskModal
            open={!!editingTask}
            onClose={() => setEditingTask(null)}
            task={tasks.find((t) => t.id === editingTask?.id) ?? editingTask}
          />

          <UserProgressModal
            open={!!progressTask}
            onClose={() => setProgressTask(null)}
            task={tasks.find((t) => t.id === progressTask?.id) ?? progressTask}
          />
        </Stack>
      )}

      {/* ── View: Dashboard (Default) ── */}
      {view === 'dashboard' && (
        <Stack spacing={4}>
          {/* Welcome Header */}
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Welcome back, {user?.first_name}! 👋
            </Typography>
            <Typography sx={{ color: '#64748b', mt: 0.5 }}>
              Real-time platform activity and fresher performance tracked live from database.
            </Typography>
          </Box>

          {/* Stat Cards Grid */}
          <Grid container spacing={3}>
            {(isDashboardLoading || isTasksLoading || isUsersLoading) ? (
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
                  label: 'Total Freshers',
                  value: `${totalFreshersCount}`,
                  icon: <PeopleIcon />,
                  color: '#2563eb',
                  bg: '#eff6ff',
                  change: `${activeFreshersCount} active • ${totalAdminsCount} admins`,
                  action: () => navigate('/admin/users'),
                },
                {
                  label: 'Active Tasks',
                  value: `${activeTasksCount}`,
                  icon: <AssignmentIcon />,
                  color: '#6366f1',
                  bg: '#eef2ff',
                  change: `${completedTasksCount} of ${totalTasksCount} tasks completed`,
                  action: () => navigate('/admin/tasks'),
                },
                {
                  label: 'Completion Rate',
                  value: `${completionRate}%`,
                  icon: <CheckCircleIcon />,
                  color: '#059669',
                  bg: '#ecfdf5',
                  change:
                    totalAssignmentsCount > 0
                      ? `${completedAssignmentsCount} of ${totalAssignmentsCount} assignments done`
                      : totalTasksCount > 0
                      ? `${completedTasksCount} of ${totalTasksCount} tasks done`
                      : 'No tasks assigned yet',
                  action: () => navigate('/admin/tasks'),
                },
                {
                  label: 'Average Score',
                  value: averageScore !== null ? `${averageScore}%` : 'N/A',
                  icon: <TrendingUpIcon />,
                  color: '#d97706',
                  bg: '#fffbeb',
                  change:
                    gradedAssignments.length > 0
                      ? `${passedCount} passed • ${gradedAssignments.length} evaluated`
                      : pendingEvaluationsCount > 0
                      ? `${pendingEvaluationsCount} awaiting review`
                      : 'No graded evaluations yet',
                  action: () => navigate('/admin/tasks'),
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

          {/* Platform Distribution & Breakdown Row */}
          <Grid container spacing={3}>
            {/* Category Breakdown */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Task Categories Distribution
                  </Typography>
                  <Chip
                    icon={<CategoryIcon fontSize="small" />}
                    label={`${totalTasksCount} Total Tasks`}
                    size="small"
                    sx={{ fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569' }}
                  />
                </Box>
                <Stack spacing={2}>
                  {['Technical', 'Training', 'Functional', 'Documentation'].map((category) => {
                    const count = categoryCounts[category] || 0;
                    const pct = totalTasksCount > 0 ? Math.round((count / totalTasksCount) * 100) : 0;
                    return (
                      <Box key={category}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                            {category}
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                            {count} {count === 1 ? 'task' : 'tasks'} ({pct}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                category === 'Technical'
                                  ? '#2563eb'
                                  : category === 'Training'
                                  ? '#7c3aed'
                                  : category === 'Functional'
                                  ? '#059669'
                                  : '#d97706',
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </Card>
            </Grid>

            {/* Status & Priority Overview */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff', height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                  Task Status & Priority Summary
                </Typography>

                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 1.5 }}>
                  Status Overview
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                  {[
                    { label: 'Completed', count: completedTasksCount, color: '#059669', bg: '#ecfdf5' },
                    {
                      label: 'In Progress',
                      count: tasks.filter((t) => t.status?.toLowerCase() === 'in progress').length,
                      color: '#2563eb',
                      bg: '#eff6ff',
                    },
                    {
                      label: 'Pending',
                      count: tasks.filter((t) => t.status?.toLowerCase() === 'pending').length,
                      color: '#64748b',
                      bg: '#f1f5f9',
                    },
                  ].map((item) => (
                    <Grid size={{ xs: 4 }} key={item.label}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: item.bg,
                          border: `1px solid ${item.bg}`,
                          textAlign: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: item.color }}>
                          {item.count}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: item.color }}>
                          {item.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 1.5 }}>
                  Priority Breakdown
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { label: 'High Priority', count: priorityCounts['High'] || 0, color: '#dc2626', bg: '#fef2f2' },
                    { label: 'Medium Priority', count: priorityCounts['Medium'] || 0, color: '#d97706', bg: '#fffbeb' },
                    { label: 'Low Priority', count: priorityCounts['Low'] || 0, color: '#059669', bg: '#ecfdf5' },
                  ].map((prio) => (
                    <Chip
                      key={prio.label}
                      label={`${prio.label}: ${prio.count}`}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        bgcolor: prio.bg,
                        color: prio.color,
                        border: '1px solid',
                        borderColor: prio.color + '33',
                      }}
                    />
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Tables Section */}
          <Grid container spacing={3}>
            {/* Recent Users Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Recent Users
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    onClick={() => navigate('/admin/users')}
                    sx={{ textTransform: 'none', fontWeight: 600, color: '#2563eb' }}
                  >
                    View All ({allUsers.length})
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Name & Email</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                            No users registered yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentUsers.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                                {row.first_name} {row.last_name}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {row.email}
                              </Typography>
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

            {/* Recent Tasks Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, background: '#ffffff', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Recent Tasks
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    onClick={() => navigate('/admin/tasks')}
                    sx={{ textTransform: 'none', fontWeight: 600, color: '#2563eb' }}
                  >
                    View All ({tasks.length})
                  </Button>
                </Box>
                <Stack spacing={2}>
                  {recentTasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 1.5 }}>
                        No tasks created yet in the database.
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/tasks')}
                        sx={{ textTransform: 'none' }}
                      >
                        Create First Task
                      </Button>
                    </Box>
                  ) : (
                    recentTasks.map((task) => {
                      const completedCount = task.assigned_freshers.filter(
                        (f) => f.status?.toLowerCase() === 'completed'
                      ).length;
                      const totalCount = task.assigned_freshers.length;

                      return (
                        <Box
                          key={task.id}
                          sx={{
                            p: 2,
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
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#2563eb' }}>
                                  {task.code}
                                </Typography>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                                  {task.title}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, alignItems: 'center' }}>
                                <Chip
                                  label={task.category}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#ffffff', color: '#475569', border: '1px solid #e2e8f0' }}
                                />
                                <Chip
                                  label={task.priority}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: task.priority?.toLowerCase() === 'high' ? '#fef2f2' : '#fffbeb',
                                    color: task.priority?.toLowerCase() === 'high' ? '#dc2626' : '#d97706',
                                  }}
                                />
                                <Chip
                                  label={`${completedCount}/${totalCount} Done`}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: totalCount > 0 && completedCount === totalCount ? '#ecfdf5' : '#eff6ff',
                                    color: totalCount > 0 && completedCount === totalCount ? '#059669' : '#2563eb',
                                  }}
                                />
                              </Stack>
                            </Box>

                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="View User Progress & Evaluation">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => setProgressTask(task)}
                                  sx={{ bgcolor: '#eff6ff' }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Task">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => setEditingTask(task)}
                                  sx={{ bgcolor: '#f0f9ff' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Assigned to:{' '}
                              {task.assigned_freshers.length === 0
                                ? 'Unassigned'
                                : task.assigned_freshers.map((f) => f.first_name).join(', ')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                              {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : 'No Due Date'}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
    </DashboardLayout>
  );
}
