import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useUpdateTaskMutation, useUploadFileMutation, useDeleteTaskCommentsMutation } from '../api/tasksApi';
import { useGetUsersQuery } from '../../users/api/usersApi';
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '../types/tasks.types';

interface EditTaskModalProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
}

export function EditTaskModal({ open, onClose, task }: EditTaskModalProps) {
  const [updateTask, { isLoading }] = useUpdateTaskMutation();
  const [deleteTaskComments, { isLoading: isDeletingComment }] = useDeleteTaskCommentsMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const { data: usersData } = useGetUsersQuery();

  const freshers = usersData?.data?.filter((u) => u.role === 'USER') ?? [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical' as TaskCategory,
    priority: 'Medium' as TaskPriority,
    status: 'Pending' as TaskStatus,
    assigned_fresher_ids: [] as string[],
    due_date: '',
    comments: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        status: task.status,
        assigned_fresher_ids: task.assigned_freshers.map((f) => f.id),
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        comments: task.comments || '',
      });
      setSelectedFile(null);
      // If current attachment is an external link, populate it in driveLink
      setDriveLink(task.attachment_url?.startsWith('http') ? task.attachment_url : '');
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      let attachment_url = driveLink.trim() || task.attachment_url;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        const uploadRes = await uploadFile(fileData).unwrap();
        attachment_url = uploadRes.data.url;
      }

      await updateTask({
        id: task.id,
        payload: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
          assigned_fresher_ids: formData.assigned_fresher_ids,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
          comments: formData.comments.trim() ? formData.comments.trim() : undefined,
          attachment_url,
        },
      }).unwrap();

      onClose();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteComment = async () => {
    if (!task) return;
    try {
      await deleteTaskComments(task.id).unwrap();
      setFormData((prev) => ({ ...prev, comments: '' }));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Edit Task: {task?.code}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Task Title *"
              required
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextField
              label="Description *"
              required
              multiline
              rows={3}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Category *"
                required
                fullWidth
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
              >
                {['Technical', 'Training', 'Functional'].map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Priority *"
                required
                fullWidth
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </TextField>

              <TextField
                select
                label="Status *"
                required
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </TextField>
            </Stack>

            <TextField
              type="date"
              label="Due Date *"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Assigned User(s) *
                </Typography>
                {freshers.length > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      const allSelected = formData.assigned_fresher_ids.length === freshers.length;
                      setFormData({
                        ...formData,
                        assigned_fresher_ids: allSelected ? [] : freshers.map((f) => f.id),
                      });
                    }}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0, px: 0.5 }}
                  >
                    {formData.assigned_fresher_ids.length === freshers.length
                      ? 'Deselect All'
                      : 'Assign to All'}
                  </Button>
                )}
              </Box>
              <FormControl fullWidth required>
                <InputLabel>Assigned User(s) *</InputLabel>
                <Select
                  multiple
                  value={formData.assigned_fresher_ids}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      assigned_fresher_ids: typeof value === 'string' ? value.split(',') : value,
                    });
                  }}
                  label="Assigned User(s) *"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const fresher = freshers.find((f) => f.id === value);
                        return <Chip key={value} label={fresher ? `${fresher.first_name} ${fresher.last_name}` : value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {freshers.length === 0 ? (
                    <MenuItem disabled>No freshers available</MenuItem>
                  ) : (
                    freshers.map((fresher) => (
                      <MenuItem key={fresher.id} value={fresher.id}>
                        {fresher.first_name} {fresher.last_name} ({fresher.email})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  Comments / Instructions
                </Typography>
                {formData.comments && (
                  <Tooltip title="Delete comment">
                    <IconButton size="small" color="error" onClick={handleDeleteComment} disabled={isDeletingComment}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <TextField
                multiline
                rows={2}
                fullWidth
                placeholder="Admin instructions or clarification..."
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontWeight: 600 }}>
                Reference Document or 3rd-Party Drive Link (Optional)
              </Typography>
              {task?.attachment_url && !selectedFile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, bgcolor: '#f1f5f9', borderRadius: 1.5 }}>
                  <AttachFileIcon fontSize="small" color="primary" />
                  <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 600, wordBreak: 'break-all' }}>
                    <a
                      href={task.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: 'none', color: '#2563eb' }}
                    >
                      {task.attachment_url.startsWith('http') ? 'Open Current Link' : 'View Current Document'}
                    </a>
                  </Typography>
                </Box>
              )}
              <Stack spacing={1.5}>
                <TextField
                  label="Google Drive / OneDrive / Cloud Link"
                  size="small"
                  fullWidth
                  placeholder="https://drive.google.com/..."
                  value={driveLink}
                  disabled={Boolean(selectedFile)}
                  onChange={(e) => setDriveLink(e.target.value)}
                />
                <Typography variant="caption" sx={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                  — OR —
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={Boolean(driveLink.trim())}
                  fullWidth
                  sx={{ py: 1.2, borderStyle: 'dashed', borderRadius: 2 }}
                >
                  {selectedFile ? selectedFile.name : 'Upload New Reference File'}
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {selectedFile && (
                  <Button
                    size="small"
                    color="error"
                    sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove selected file
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || isUploading || !formData.title || formData.assigned_fresher_ids.length === 0}
          >
            {isLoading || isUploading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
