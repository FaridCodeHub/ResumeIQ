import { useState } from 'react';

import {
  AutoAwesomeRounded,
  DashboardRounded,
  DescriptionRounded,
  WorkOutlineRounded,
  AnalyticsRounded,
  FactCheckRounded,
  PsychologyRounded,
  LightbulbRounded,
  HistoryRounded,
  SettingsRounded,
  LogoutRounded,
} from '@mui/icons-material';

import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';

import { NavLink, useNavigate } from 'react-router-dom';

import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const navigationItems = [
  { label: 'Overview', path: '/dashboard', icon: <DashboardRounded /> },
  { label: 'My Resumes', path: '/resumes', icon: <DescriptionRounded /> },
  { label: 'Job Descriptions', path: '/jobs', icon: <WorkOutlineRounded /> },
  { label: 'Resume Analysis', path: '/analysis', icon: <AnalyticsRounded /> },
  { label: 'ATS Analysis', path: '/ats', icon: <FactCheckRounded /> },
  { label: 'Skill Gap Analysis', path: '/skills', icon: <PsychologyRounded /> },
  {
    label: 'Career Recommendations',
    path: '/careers',
    icon: <LightbulbRounded />,
  },
  { label: 'Analysis History', path: '/history', icon: <HistoryRounded /> },
];

interface SidebarProps {
  onNavigate?: () => void;
}

function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { clearUser } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });

      clearUser();

      onNavigate?.();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to log out. Please try again.'
      );

      setIsLoggingOut(false);
    }
  };

  return (
    <Box
      sx={{
        width: 270,
        height: '100%',
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #E8EDF4',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 3,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <AutoAwesomeRounded sx={{ color: '#635BFF', fontSize: 32 }} />

        <Typography variant="h5" fontWeight={800} letterSpacing="-1px">
          Resume<span style={{ color: '#635BFF' }}>IQ</span>
        </Typography>
      </Box>

      <Divider />

      {/* Main Navigation */}
      <Box sx={{ px: 2, py: 2, flexGrow: 1, overflowY: 'auto' }}>
        <Typography
          sx={{
            px: 2,
            mb: 1.5,
            color: '#94A3B8',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          Workspace
        </Typography>

        <List disablePadding>
          {navigationItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={onNavigate}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.2,
                color: '#64748B',

                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                  minWidth: 38,
                },

                '&.active': {
                  bgcolor: '#EEEDFF',
                  color: '#635BFF',
                },

                '&:hover': {
                  bgcolor: '#F5F4FF',
                  color: '#635BFF',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>

              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 13.5,
                  fontWeight: 600,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Divider />

      {/* Bottom Navigation */}
      <Box sx={{ px: 2, py: 2 }}>
        <ListItemButton
          component={NavLink}
          to="/settings"
          onClick={onNavigate}
          sx={{
            borderRadius: 2,
            color: '#64748B',

            '&.active': {
              bgcolor: '#EEEDFF',
              color: '#635BFF',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>
            <SettingsRounded />
          </ListItemIcon>

          <ListItemText
            primary="Settings"
            primaryTypographyProps={{
              fontSize: 13.5,
              fontWeight: 600,
            }}
          />
        </ListItemButton>

        {/* Logout */}
        <ListItemButton
          onClick={handleLogout}
          disabled={isLoggingOut}
          sx={{
            borderRadius: 2,
            color: '#64748B',
            mt: 0.5,

            '&:hover': {
              bgcolor: '#FFF1F2',
              color: '#E11D48',
            },

            '&.Mui-disabled': {
              opacity: 0.6,
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>
            <LogoutRounded />
          </ListItemIcon>

          <ListItemText
            primary={isLoggingOut ? 'Logging out...' : 'Logout'}
            primaryTypographyProps={{
              fontSize: 13.5,
              fontWeight: 600,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default Sidebar;