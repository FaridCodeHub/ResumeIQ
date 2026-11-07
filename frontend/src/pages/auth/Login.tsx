import { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  success: boolean;
  message: string;
}

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');

    try {
      const response = await apiRequest<LoginResponse>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      if (!response.success) {
        setServerError(response.message || 'Login failed.');
        return;
      }

      // Update the global authentication state.
      const authenticatedUser = await refreshUser();

      if (!authenticatedUser) {
        setServerError(
          'Login succeeded, but we could not verify your session. Please try again.'
        );
        return;
      }

      // Navigate only after authentication is verified.
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
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

          <Typography variant="body1" color="text.secondary">
            Welcome back! Sign in to continue your career journey.
          </Typography>
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
            Sign in to your account
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={4}>
            Enter your email and password below.
          </Typography>

          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {serverError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Email Address
                </Typography>

                <TextField
                  fullWidth
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Password
                </Typography>

                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon />
                          ) : (
                            <VisibilityOutlinedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box display="flex" justifyContent="flex-end">
                <Typography
                  component={Link}
                  to="/forgot-password"
                  variant="body2"
                  sx={{
                    color: '#635BFF',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: '#635BFF',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: '#5148E5',
                  },
                }}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography textAlign="center" variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Typography
              component={Link}
              to="/register"
              variant="body2"
              fontWeight={700}
              sx={{
                color: '#635BFF',
                textDecoration: 'none',
              }}
            >
              Create account
            </Typography>
          </Typography>
        </Paper>

        <Typography
          textAlign="center"
          variant="caption"
          color="text.secondary"
          display="block"
          mt={3}
        >
          © 2026 ResumeIQ. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default Login;

/*
### Login Flow

1. User submits email and password.
2. Frontend sends credentials to the backend.
3. Backend validates credentials and sets authentication cookies.
4. Frontend calls `/api/auth/me`.
5. `AuthContext` receives and stores the authenticated user.
6. User is redirected to `/dashboard`.
*/