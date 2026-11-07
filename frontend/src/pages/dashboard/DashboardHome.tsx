import {
  DescriptionRounded,
  AnalyticsRounded,
  WorkOutlineRounded,
  PsychologyRounded,
  ArrowForwardRounded,
  TrendingUpRounded,
  AddRounded,
  CloudUploadRounded,
  AutoAwesomeRounded,
} from '@mui/icons-material';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  LinearProgress,
} from '@mui/material';

import { useNavigate } from 'react-router-dom';

const statistics = [
  {
    title: 'Total Resumes',
    value: '04',
    subtitle: 'Uploaded resumes',
    icon: <DescriptionRounded />,
    color: '#635BFF',
    background: '#EEEDFF',
  },
  {
    title: 'Analyses Completed',
    value: '12',
    subtitle: 'Resume analyses',
    icon: <AnalyticsRounded />,
    color: '#0891B2',
    background: '#E0F7FA',
  },
  {
    title: 'Job Matches',
    value: '08',
    subtitle: 'Matched opportunities',
    icon: <WorkOutlineRounded />,
    color: '#16A34A',
    background: '#DCFCE7',
  },
  {
    title: 'Skills Identified',
    value: '24',
    subtitle: 'Extracted skills',
    icon: <PsychologyRounded />,
    color: '#D97706',
    background: '#FEF3C7',
  },
];

const recentActivities = [
  {
    title: 'Frontend Developer Resume',
    company: 'Sample job description',
    date: 'October 28, 2026',
    score: 85,
    status: 'Completed',
  },
  {
    title: 'Software Engineer Resume',
    company: 'Sample job description',
    date: 'October 26, 2026',
    score: 72,
    status: 'Completed',
  },
  {
    title: 'UI/UX Designer Resume',
    company: 'Sample job description',
    date: 'October 24, 2026',
    score: 91,
    status: 'Completed',
  },
];

function DashboardHome() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Welcome Section */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-1px',
              color: '#172033',
              fontSize: { xs: '1.6rem', sm: '2rem' },
            }}
          >
            Dashboard Overview
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 1, fontSize: 14 }}
          >
            Track your resume performance and career progress.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => navigate('/upload')}
          sx={{
            bgcolor: '#635BFF',
            borderRadius: 2,
            px: 2.5,
            py: 1.2,
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': {
              bgcolor: '#5046E5',
            },
          }}
        >
          Upload Resume
        </Button>
      </Stack>

      {/* Statistics Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {statistics.map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item.title}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #E8EDF4',
                borderRadius: 3,
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      sx={{
                        color: '#64748B',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 29,
                        fontWeight: 800,
                        color: '#172033',
                        mt: 1,
                      }}
                    >
                      {item.value}
                    </Typography>

                    <Typography
                      sx={{
                        color: '#94A3B8',
                        fontSize: 12,
                        mt: 0.5,
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      display: 'grid',
                      placeItems: 'center',
                      color: item.color,
                      bgcolor: item.background,
                    }}
                  >
                    {item.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Resume Score and Quick Actions */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #E8EDF4',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography variant="h6" fontWeight={800}>
                Resume Performance
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 13, mt: 0.5, mb: 3 }}
              >
                Illustrative resume quality overview.
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                spacing={3}
                sx={{ mb: 3 }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 46,
                      fontWeight: 850,
                      color: '#635BFF',
                      lineHeight: 1.2,
                    }}
                  >
                    85%
                  </Typography>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                  >
                    <TrendingUpRounded
                      sx={{ color: '#16A34A', fontSize: 17 }}
                    />

                    <Typography
                      sx={{
                        color: '#16A34A',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Sample score
                    </Typography>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    width: 1,
                    height: 65,
                    bgcolor: '#E8EDF4',
                  }}
                />

                <Box>
                  <Typography fontWeight={700}>
                    Resume quality
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: 12, mt: 0.5 }}
                  >
                    Example performance indicator
                  </Typography>
                </Box>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={85}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#EEEDFF',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#635BFF',
                    borderRadius: 5,
                  },
                }}
              />

              <Typography
                color="text.secondary"
                sx={{ fontSize: 12, mt: 2 }}
              >
                Actual scores will be calculated after implementing the
                resume analysis engine.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #E8EDF4',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2.5 }}>
                Quick Actions
              </Typography>

              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CloudUploadRounded />}
                  onClick={() => navigate('/upload')}
                  sx={{
                    justifyContent: 'flex-start',
                    bgcolor: '#635BFF',
                    py: 1.4,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#5046E5' },
                  }}
                >
                  Upload New Resume
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<WorkOutlineRounded />}
                  onClick={() => navigate('/jobs')}
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#475569',
                    borderColor: '#E2E8F0',
                    py: 1.4,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Add Job Description
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AutoAwesomeRounded />}
                  onClick={() => navigate('/analysis')}
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#475569',
                    borderColor: '#E2E8F0',
                    py: 1.4,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Analyze Resume
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Analysis */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid #E8EDF4',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Recent Analyses
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 13, mt: 0.5 }}
              >
                Your latest resume analysis activities.
              </Typography>
            </Box>

            <Button
              endIcon={<ArrowForwardRounded />}
              onClick={() => navigate('/history')}
              sx={{
                color: '#635BFF',
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              View All
            </Button>
          </Stack>

          <Stack spacing={0}>
            {recentActivities.map((activity, index) => (
              <Box
                key={activity.title}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  py: 2,
                  borderBottom:
                    index !== recentActivities.length - 1
                      ? '1px solid #F1F5F9'
                      : 'none',
                }}
              >
                <Box>
                  <Typography fontWeight={700} sx={{ fontSize: 14 }}>
                    {activity.title}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: 12, mt: 0.5 }}
                  >
                    {activity.company} • {activity.date}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                >
                  <Chip
                    label={activity.status}
                    size="small"
                    sx={{
                      bgcolor: '#DCFCE7',
                      color: '#15803D',
                      fontWeight: 700,
                    }}
                  />

                  <Typography
                    sx={{
                      color: '#635BFF',
                      fontWeight: 800,
                      fontSize: 16,
                      minWidth: 45,
                      textAlign: 'right',
                    }}
                  >
                    {activity.score}%
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Sample Data Notice */}
      <Box sx={{ mt: 3 }}>
        <Chip
          label="Demo dashboard — sample data only"
          size="small"
          sx={{
            bgcolor: '#FFF7ED',
            color: '#C2410C',
            fontWeight: 600,
          }}
        />
      </Box>
    </Box>
  );
}

export default DashboardHome;