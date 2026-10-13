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
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
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

interface AdminHomePageProps {
  view?: 'dashboard' | 'users' | 'freshers' | 'tasks';
}

const adminNavItems: SidebarNavOption[] = [
  { label: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { label: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'Tasks', path: '/admin/tasks', icon: <AssignmentIcon /> },
];

export default function AdminHomePage({ view = 'dashboard' }: AdminHomePageProps) {
  const { user } = useAuth();
  const { data: usersData } = useGetUsersQuery();

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

  const recentUsers = usersData?.data?.slice(0, 4) ?? [];
  const tasks = tasksData?.data ?? [];

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
              { label: 'Active Tasks', value: `${tasks.length}`, icon: <AssignmentIcon />, color: '#6366f1', bg: '#eef2ff', change: 'Live tracked' },
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
                  Recent Tasks
                </Typography>
                <Stack spacing={2}>
                  {tasks.length === 0 ? (
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>No tasks found.</Typography>
                  ) : (
                    tasks.slice(0, 3).map((task) => (
                      <Box key={task.id} sx={{ p: 1.5, borderRadius: 2, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                            {task.title}
                          </Typography>
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
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Assigned to: {task.assigned_freshers.map((f) => f.first_name).join(', ') || 'Unassigned'}
                          {task.due_date ? ` • Due ${new Date(task.due_date).toLocaleDateString()}` : ''}
                        </Typography>
                      </Box>
                    ))
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
