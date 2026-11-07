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

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
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

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Name must contain at least 3 characters')
      .max(150, 'Name cannot exceed 150 characters'),

    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .max(255, 'Email cannot exceed 255 characters'),

    password: z
      .string()
      .min(8, 'Password must contain at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterResponse {
  success: boolean;
  message: string;
}

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');

    try {
      const response = await apiRequest<RegisterResponse>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      if (!response.success) {
        setServerError(response.message || 'Registration failed.');
        return;
      }

      // Update global authentication state.
      const authenticatedUser = await refreshUser();

      if (!authenticatedUser) {
        setServerError(
          'Account created, but we could not verify your session. Please sign in.'
        );
        return;
      }

      // Navigate after the session has been verified.
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
        py: { xs: 2, sm: 2.5 },
      }}
    >
      <Container maxWidth="sm">
        <Box textAlign="center" mb={2}>
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
            Create your account and take the next step in your career.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 3.5 },
            borderRadius: 4,
            border: '1px solid #EAE9F2',
            boxShadow: '0 20px 60px rgba(45, 35, 100, 0.08)',
          }}
        >
          <Typography variant="h5" fontWeight={700} mb={1}>
            Create an account
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Fill in your details to get started.
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
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Full Name
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Email Address
                </Typography>

                <TextField
                  fullWidth
                  size="small"
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
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  autoComplete="new-password"
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

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Confirm Password
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirmPassword ? (
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
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography textAlign="center" variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Typography
              component={Link}
              to="/login"
              variant="body2"
              fontWeight={700}
              sx={{
                color: '#635BFF',
                textDecoration: 'none',
              }}
            >
              Sign in
            </Typography>
          </Typography>
        </Paper>

        <Typography
          textAlign="center"
          variant="caption"
          color="text.secondary"
          display="block"
          mt={2}
        >
          © 2026 ResumeIQ. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default Register;

/*
### Registration Flow

After successful registration:

1. Backend creates the user account.
2. Backend sets authentication cookies.
3. Frontend calls `/api/auth/me`.
4. `AuthContext` stores the new user's information.
5. User is redirected to the dashboard.
*/