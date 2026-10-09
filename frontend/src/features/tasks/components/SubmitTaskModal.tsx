import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  LinearProgress,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useSubmitTaskMutation, useUploadFileMutation } from '../api/tasksApi';
import type { Task } from '../types/tasks.types';

interface SubmitTaskModalProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
}

export function SubmitTaskModal({ open, onClose, task }: SubmitTaskModalProps) {
  const [submitTask, { isLoading }] = useSubmitTaskMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  
  const [summary, setSummary] = useState('');
  const [comments, setComments] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      let document_url = driveLink.trim() || undefined;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        const uploadRes = await uploadFile(fileData).unwrap();
        document_url = uploadRes.data.url;
      }

      await submitTask({
        id: task.id,
        payload: {
          completion_summary: summary.trim() || undefined,
          document_url,
          comments: comments.trim() || undefined,
        },
      }).unwrap();
      
      onClose();
      setSummary('');
      setComments('');
      setSelectedFile(null);
      setDriveLink('');
    } catch (err) {
      console.error('Failed to submit task:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Task Work</DialogTitle>
        <DialogContent dividers>
          {task && (
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                  {task.code} - {task.title}
                </Typography>
                <Chip
                  label={task.status}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    bgcolor: task.status?.toLowerCase() === 'completed' ? '#ecfdf5' : '#eff6ff',
                    color: task.status?.toLowerCase() === 'completed' ? '#059669' : '#2563eb',
                  }}
                />
              </Box>

              {task.description && (
                <Typography sx={{ color: '#475569', fontSize: '0.85rem', mt: 0.5, mb: 1.5, whiteSpace: 'pre-wrap' }}>
                  {task.description}
                </Typography>
              )}

              {/* Progress Bar inside Task Modal */}
              {(() => {
                const myAssignment = task.assigned_freshers?.[0];
                const rawProgress = myAssignment?.assessment_result;
                let progressPercent = 0;

                if (rawProgress && !isNaN(Number(rawProgress))) {
                  progressPercent = Math.min(100, Math.max(0, Number(rawProgress)));
                } else if (task.status?.toLowerCase() === 'completed') {
                  progressPercent = 100;
                } else if (task.status?.toLowerCase() === 'in progress') {
                  progressPercent = 50;
                }

                return (
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                        TASK PROGRESS
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>
                        {progressPercent}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercent}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: progressPercent === 100 ? '#10b981' : '#2563eb',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                );
              })()}

              {/* Display Admin Feedback / Reopen Note if present */}
              {(() => {
                const myAssignment = task.assigned_freshers?.find((f) => f.comments);
                const feedbackComment = myAssignment?.comments || task.comments;
                if (!feedbackComment) return null;

                return (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#fffbeb',
                      border: '1px solid #fde68a',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: '#b45309', display: 'block', mb: 0.5 }}
                    >
                      💬 ADMIN / MENTOR FEEDBACK
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#78350f', whiteSpace: 'pre-wrap' }}>
                      {feedbackComment}
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          )}

          <Stack spacing={3}>
            <TextField
              label="Completion Summary (Optional)"
              multiline
              rows={3}
              fullWidth
              placeholder="Describe the work you have completed..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />

            <TextField
              label="Submission Notes / Comments (Optional)"
              multiline
              rows={2}
              fullWidth
              placeholder="Any notes or remarks for your mentor..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />

            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontWeight: 600 }}>
                Deliverable Document or 3rd-Party Drive Link (Optional)
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Google Drive / GitHub / Cloud Link"
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
                  {selectedFile ? selectedFile.name : 'Upload Completed Document'}
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
            color="success"
            disabled={isLoading || isUploading || (!summary.trim() && !selectedFile && !driveLink.trim())}
          >
            {isLoading || isUploading ? 'Submitting...' : 'Submit Work'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
