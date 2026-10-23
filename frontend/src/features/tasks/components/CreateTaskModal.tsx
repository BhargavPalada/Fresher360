import { useState } from 'react';
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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useCreateTaskMutation, useUploadFileMutation } from '../api/tasksApi';
import { useGetUsersQuery } from '../../users/api/usersApi';
import type { TaskCategory, TaskPriority } from '../types/tasks.types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const { data: usersData } = useGetUsersQuery();

  const freshers = usersData?.data?.filter((u) => u.role === 'USER') ?? [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical' as TaskCategory,
    priority: 'Medium' as TaskPriority,
    assigned_fresher_ids: [] as string[],
    due_date: '',
    comments: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.due_date || formData.assigned_fresher_ids.length === 0) {
      return;
    }

    try {
      let attachment_url = driveLink.trim() || undefined;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        const uploadRes = await uploadFile(fileData).unwrap();
        attachment_url = uploadRes.data.url;
      }

      await createTask({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        assigned_fresher_ids: formData.assigned_fresher_ids,
        due_date: new Date(formData.due_date).toISOString(),
        comments: formData.comments.trim() ? formData.comments.trim() : undefined,
        attachment_url,
      }).unwrap();

      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Technical',
        priority: 'Medium',
        assigned_fresher_ids: [],
        due_date: '',
        comments: '',
      });
      setSelectedFile(null);
      setDriveLink('');
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const isFormValid =
    Boolean(formData.title.trim()) &&
    Boolean(formData.description.trim()) &&
    Boolean(formData.due_date) &&
    formData.assigned_fresher_ids.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Create New Task</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Task Title"
              required
              fullWidth
              placeholder="e.g. Implement User Authentication"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextField
              label="Description"
              required
              multiline
              rows={3}
              fullWidth
              placeholder="Detailed instructions and information required to complete the task"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Category"
                required
                fullWidth
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
              >
                {['Technical', 'Training', 'Functional', 'Documentation'].map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Priority"
                required
                fullWidth
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </TextField>
            </Stack>

            <TextField
              type="date"
              label="Due Date"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Assigned User(s) <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
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
                <InputLabel>Assigned User(s)</InputLabel>
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
                  label="Assigned User(s)"
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

            <TextField
              label="Comments / Initial Instructions (Optional)"
              multiline
              rows={2}
              fullWidth
              placeholder="Admin initial instructions, clarification, or guidance..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            />

            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontWeight: 600 }}>
                Admin Reference Document or 3rd-Party Drive Link (Optional)
              </Typography>
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
                  {selectedFile ? selectedFile.name : 'Attach Reference File'}
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
                    Remove file
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
            disabled={isLoading || isUploading || !isFormValid}
          >
            {isLoading || isUploading ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
