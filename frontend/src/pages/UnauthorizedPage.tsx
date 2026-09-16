import { Box, Button, Stack, Typography } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '24px',
            background: 'rgba(211, 47, 47, 0.15)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BlockIcon sx={{ color: '#ff6b6b', fontSize: 36 }} />
        </Box>

        <Box>
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}
          >
            403
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            Access Denied
          </Typography>
        </Box>

        <Typography sx={{ color: 'rgba(255,255,255,0.4)', maxWidth: 300 }}>
          You don't have permission to access this page.
          This action has been logged.
        </Typography>

        <Button
          id="go-back-button"
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{
            borderColor: 'rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)',
            borderRadius: 2,
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)',
            },
          }}
        >
          Go Back
        </Button>
      </Stack>
    </Box>
  );
}
