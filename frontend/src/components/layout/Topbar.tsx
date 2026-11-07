import {
  MenuRounded,
  NotificationsNoneRounded,
  SearchRounded,
  KeyboardArrowDownRounded,
} from '@mui/icons-material';

import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';

interface TopbarProps {
  onMenuClick: () => void;
  pageTitle: string;
}

function Topbar({ onMenuClick, pageTitle }: TopbarProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#FFFFFF',
        color: '#172033',
        borderBottom: '1px solid #E8EDF4',
      }}
    >
      <Toolbar
        sx={{
          minHeight: '76px !important',
          px: { xs: 2, sm: 3 },
          gap: 2,
        }}
      >
        {/* Mobile Menu Button */}
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { xs: 'flex', md: 'none' },
            color: '#64748B',
          }}
        >
          <MenuRounded />
        </IconButton>

        {/* Page Title */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.5px',
              fontSize: { xs: '1rem', sm: '1.2rem' },
            }}
          >
            {pageTitle}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: '#94A3B8',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Welcome back! Here's your career overview.
          </Typography>
        </Box>

        {/* Search */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            bgcolor: '#F8FAFC',
            border: '1px solid #E8EDF4',
            borderRadius: 2,
            px: 1.5,
            py: 0.8,
            width: { sm: 180, md: 230 },
          }}
        >
          <SearchRounded sx={{ color: '#94A3B8', fontSize: 21 }} />

          <InputBase
            placeholder="Search..."
            sx={{
              ml: 1,
              flex: 1,
              fontSize: 13,
            }}
          />
        </Box>

        {/* Notifications */}
        <IconButton
          sx={{
            color: '#64748B',
            bgcolor: '#F8FAFC',
            border: '1px solid #E8EDF4',
            borderRadius: 2,
          }}
        >
          <NotificationsNoneRounded />
        </IconButton>

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx: 0.5,
            my: 2,
            display: { xs: 'none', sm: 'block' },
          }}
        />

        {/* User Profile */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: '#635BFF',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            F
          </Avatar>

          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: '#172033',
              }}
            >
              Farid
            </Typography>

            <Typography
              sx={{
                fontSize: 11,
                color: '#94A3B8',
              }}
            >
              Student
            </Typography>
          </Box>

          <KeyboardArrowDownRounded
            sx={{
              color: '#94A3B8',
              display: { xs: 'none', md: 'block' },
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;