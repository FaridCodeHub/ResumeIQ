import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Password reset functionality will be connected to the backend later.
    alert('Password reset functionality will be available soon.');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, #F7F6FF 0%, #FFFFFF 55%, #F0EEFF 100%)',
        py: 5,
      }}
    >
      <Container maxWidth="sm">
        <Box textAlign="center" mb={4}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            mb={2}
          >
            <AutoAwesomeOutlinedIcon
              sx={{ color: '#635BFF', fontSize: 34 }}
            />

            <Typography variant="h4" fontWeight={800} color="#17152B">
              ResumeIQ
            </Typography>
          </Stack>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            border: '1px solid #EAE9F2',
            boxShadow: '0 20px 60px rgba(45, 35, 100, 0.08)',
          }}
        >
          <Typography variant="h5" fontWeight={700} mb={1}>
            Forgot your password?
          </Typography>

          <Typography color="text.secondary" variant="body2" mb={4}>
            Enter your registered email address. We'll help you reset your
            password.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                required
                type="email"
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: '#635BFF',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#5148E5',
                  },
                }}
              >
                Send Reset Instructions
              </Button>
            </Stack>
          </Box>

          <Box textAlign="center" mt={3}>
            <Button
              component={Link}
              to="/login"
              startIcon={<ArrowBackOutlinedIcon />}
              sx={{
                color: '#635BFF',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default ForgotPassword;