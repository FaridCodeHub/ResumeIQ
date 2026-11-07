import { useState, type ReactNode } from 'react';

import {
  Box,
  Drawer,
} from '@mui/material';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

const SIDEBAR_WIDTH = 270;

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

function DashboardLayout({
  children,
  pageTitle,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((previous) => !previous);
  };

  const handleCloseDrawer = () => {
    setMobileOpen(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#F8FAFC',
      }}
    >
      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,

          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        <Sidebar />
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleCloseDrawer}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },

          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        <Sidebar onNavigate={handleCloseDrawer} />
      </Drawer>

      {/* Main Application Area */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar
          onMenuClick={handleDrawerToggle}
          pageTitle={pageTitle}
        />

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            maxWidth: 1600,
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default DashboardLayout;