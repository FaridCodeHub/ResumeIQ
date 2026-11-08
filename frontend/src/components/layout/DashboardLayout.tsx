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
        height: '100dvh',
        width: '100%',
        overflow: 'hidden',
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
            height: '100dvh',
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
          minHeight: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            p: { xs: 1.5, sm: 2, md: 2 },
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