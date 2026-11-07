import {
  Box,
  CircularProgress,
} from '@mui/material';

import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait until the backend authentication check finishes.
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#F8FAFC',
        }}
      >
        <CircularProgress sx={{ color: '#635BFF' }} />
      </Box>
    );
  }

  // Redirect unauthenticated users to login.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Allow authenticated users to access protected pages.
  return <Outlet />;
}

export default ProtectedRoute;

/*
### Protected Route

- Checks authentication using `AuthContext`.
- Displays a loading indicator while checking the backend.
- Redirects unauthenticated visitors to `/login`.
- Allows authenticated users to continue to their requested page.
- Remembers the page they originally tried to visit.
*/