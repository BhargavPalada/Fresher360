import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  Chip,
  Card,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Slider,
  LinearProgress,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import RateReviewIcon from '@mui/icons-material/RateReview';
import {
  useUpdateAssignmentMutation,
  useDeleteAssignmentCommentsMutation,
} from '../api/tasksApi';
import type { Task, AssignedFresher, TaskStatus, AssessmentStatus } from '../types/tasks.types';

interface UserProgressModalProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
}

export function UserProgressModal({ open, onClose, task }: UserProgressModalProps) {
  const [updateAssignment, { isLoading: isUpdating }] = useUpdateAssignmentMutation();
  const [deleteAssignmentComments, { isLoading: isDeletingComment }] = useDeleteAssignmentCommentsMutation();

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [evalForm, setEvalForm] = useState<{
    status: TaskStatus;
    assessment_status: AssessmentStatus;
    progress: number;
    comments: string;
  }>({
    status: 'Pending',
    assessment_status: 'Pending',
    progress: 0,
    comments: '',
  });

  const parseProgress = (result?: string, status?: string): number => {
    if (result && !isNaN(Number(result))) {
      return Math.min(100, Math.max(0, Number(result)));
    }
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 100;
    if (s === 'in progress' || s === 'in review') return 50;
    return 0;
  };

  if (!task) return null;

  const handleStartEdit = (fresher: AssignedFresher) => {
    setEditingUserId(fresher.id);
    const initialProgress = parseProgress(fresher.assessment_result, fresher.status);
    setEvalForm({
      status: (fresher.status as TaskStatus) || 'Pending',
      assessment_status: (fresher.assessment_status as AssessmentStatus) || 'Pending',
      progress: initialProgress,
      comments: fresher.comments || '',
    });
  };

  const handleSaveEvaluation = async (userId: string) => {
    try {
      const targetStatus = evalForm.progress === 100 ? 'Completed' : evalForm.status;

      await updateAssignment({
        taskId: task.id,
        userId,
        payload: {
          status: targetStatus,
          assessment_status: evalForm.assessment_status,
          assessment_result: `${evalForm.progress}`,
          comments: evalForm.comments.trim() || undefined,
        },
      }).unwrap();
      setEditingUserId(null);
    } catch (err) {
      console.error('Failed to update assignment:', err);
    }
  };

  const handleDeleteComment = async (userId: string) => {
    try {
      await deleteAssignmentComments({
        taskId: task.id,
        userId,
      }).unwrap();
      if (editingUserId === userId) {
        setEvalForm((prev) => ({ ...prev, comments: '' }));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const completedCount = task.assigned_freshers.filter(
    (f) => f.status?.toLowerCase() === 'completed'
  ).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {task.code}: {task.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Category: <b>{task.category}</b> • Priority: <b>{task.priority}</b> • Due:{' '}
              <b>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</b>
            </Typography>
          </Box>
          <Chip
            label={`${completedCount}/${task.assigned_freshers.length} Completed`}
            color={completedCount === task.assigned_freshers.length ? 'success' : 'primary'}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Task Info Summary */}
          {task.description && (
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Task Description
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {task.description}
              </Typography>
              {task.attachment_url && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFileIcon fontSize="small" color="primary" />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    <a
                      href={task.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'none' }}
                    >
                      {task.attachment_url.startsWith('http')
                        ? 'Open Admin Reference Link'
                        : 'Download Admin Reference Material'}
                    </a>
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* User-Wise Progress Breakdown */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
              User-Wise Progress & Assessment Records
            </Typography>

            {task.assigned_freshers.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                No users assigned to this task.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {task.assigned_freshers.map((fresher) => {
                  const isEditing = editingUserId === fresher.id;
                  const isCompleted = fresher.status?.toLowerCase() === 'completed';

                  return (
                    <Card
                      key={fresher.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        border: '1px solid #e2e8f0',
                        bgcolor: isCompleted ? '#fafdfb' : '#ffffff',
                      }}
                    >
                      <Stack spacing={2}>
                        {/* Fresher Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                bgcolor: isCompleted ? '#dcfce7' : '#eff6ff',
                                color: isCompleted ? '#16a34a' : '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PersonIcon fontSize="small" />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                {fresher.first_name} {fresher.last_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {fresher.email}
                              </Typography>
                            </Box>
                          </Box>

                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Chip
                              label={fresher.status}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                bgcolor: isCompleted ? '#ecfdf5' : '#eff6ff',
                                color: isCompleted ? '#059669' : '#2563eb',
                              }}
                            />
                            <Chip
                              label={`Assessment: ${fresher.assessment_status || 'Pending'}`}
                              size="small"
                              variant="outlined"
                              color={
                                fresher.assessment_status === 'Passed'
                                  ? 'success'
                                  : fresher.assessment_status === 'Failed'
                                  ? 'error'
                                  : 'default'
                              }
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                            {!isEditing && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<RateReviewIcon />}
                                onClick={() => handleStartEdit(fresher)}
                                sx={{ borderRadius: 1.5, textTransform: 'none', ml: 1 }}
                              >
                                Evaluate
                              </Button>
                            )}
                          </Stack>
                        </Box>

                        <Divider />

                        {/* Submitted Document & Completion Summary */}
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block' }}>
                              SUBMITTED DOCUMENT
                            </Typography>
                            {fresher.document_url ? (
                              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <OpenInNewIcon fontSize="small" color="primary" />
                                <a
                                  href={fresher.document_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize: '0.85rem',
                                    color: '#2563eb',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {fresher.document_url.startsWith('http')
                                    ? 'Open Submitted Drive / Cloud Link'
                                    : 'View Submitted Document'}
                                </a>
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', mt: 0.5 }}>
                                No document submitted yet
                              </Typography>
                            )}
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block' }}>
                              COMPLETION SUMMARY
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#334155', mt: 0.5, fontStyle: fresher.completion_summary ? 'normal' : 'italic' }}>
                              {fresher.completion_summary || 'No summary provided'}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Progress Bar & Comments View (when not editing) */}
                        {!isEditing && (
                          <Grid container spacing={2} sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                                  PROGRESS
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb' }}>
                                  {parseProgress(fresher.assessment_result, fresher.status)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={parseProgress(fresher.assessment_result, fresher.status)}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: '#e2e8f0',
                                  mt: 1,
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor:
                                      parseProgress(fresher.assessment_result, fresher.status) === 100
                                        ? '#10b981'
                                        : '#2563eb',
                                    borderRadius: 4,
                                  },
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block' }}>
                                  MENTOR / ADMIN COMMENTS
                                </Typography>
                                {fresher.comments && (
                                  <Tooltip title="Delete comment">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteComment(fresher.id)}
                                      disabled={isDeletingComment}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                              <Typography variant="body2" sx={{ color: '#334155', mt: 0.5, fontStyle: fresher.comments ? 'normal' : 'italic' }}>
                                {fresher.comments || 'No comments'}
                              </Typography>
                            </Grid>
                          </Grid>
                        )}

                        {/* Editing Assessment Form */}
                        {isEditing && (
                          <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                              Update Assignment & Assessment
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  select
                                  label="Task Status"
                                  required
                                  size="small"
                                  fullWidth
                                  value={evalForm.status}
                                  onChange={(e) =>
                                    setEvalForm({ ...evalForm, status: e.target.value as TaskStatus })
                                  }
                                >
                                  <MenuItem value="Pending">Pending</MenuItem>
                                  <MenuItem value="In Progress">In Progress</MenuItem>
                                  <MenuItem value="Completed">Completed</MenuItem>
                                </TextField>
                              </Grid>

                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  select
                                  label="Assessment Status"
                                  required
                                  size="small"
                                  fullWidth
                                  value={evalForm.assessment_status}
                                  onChange={(e) =>
                                    setEvalForm({
                                      ...evalForm,
                                      assessment_status: e.target.value as AssessmentStatus,
                                    })
                                  }
                                >
                                  <MenuItem value="Pending">Pending</MenuItem>
                                  <MenuItem value="Under Review">Under Review</MenuItem>
                                  <MenuItem value="Passed">Passed</MenuItem>
                                  <MenuItem value="Failed">Failed</MenuItem>
                                </TextField>
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <Box sx={{ px: 1, py: 0.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                                      UPDATE PROGRESS
                                    </Typography>
                                    <Chip
                                      label={`${evalForm.progress}%`}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        bgcolor: evalForm.progress === 100 ? '#ecfdf5' : '#eff6ff',
                                        color: evalForm.progress === 100 ? '#059669' : '#2563eb',
                                      }}
                                    />
                                  </Box>
                                  <Slider
                                    value={evalForm.progress}
                                    step={5}
                                    marks={[
                                      { value: 0, label: '0%' },
                                      { value: 25, label: '25%' },
                                      { value: 50, label: '50%' },
                                      { value: 75, label: '75%' },
                                      { value: 100, label: '100%' },
                                    ]}
                                    min={0}
                                    max={100}
                                    valueLabelDisplay="auto"
                                    onChange={(_, val) => {
                                      const newProgress = val as number;
                                      setEvalForm((prev) => ({
                                        ...prev,
                                        progress: newProgress,
                                        status: newProgress === 100 ? 'Completed' : (newProgress > 0 ? 'In Progress' : 'Pending'),
                                      }));
                                    }}
                                  />
                                </Box>
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <TextField
                                  label="Comments for this Fresher"
                                  multiline
                                  rows={2}
                                  size="small"
                                  fullWidth
                                  placeholder="Add or edit feedback/instructions for this fresher..."
                                  value={evalForm.comments}
                                  onChange={(e) =>
                                    setEvalForm({ ...evalForm, comments: e.target.value })
                                  }
                                />
                              </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                              <Button
                                size="small"
                                color="inherit"
                                onClick={() => setEditingUserId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleSaveEvaluation(fresher.id)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? 'Saving...' : 'Save Evaluation'}
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
