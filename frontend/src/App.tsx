
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';

import {
  AutoAwesomeRounded,
  CloudUploadOutlined,
  DescriptionOutlined,
  InsightsRounded,
  CheckCircleRounded,
  ArrowForwardRounded,
  SecurityRounded,
  TipsAndUpdatesRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import ResumeUpload from './pages/ResumeUpload';

const features = [
  {
    icon: <InsightsRounded />,
    title: 'Resume Analysis',
    description:
      'Understand your resume strengths and discover areas that need improvement.',
  },
  {
    icon: <TipsAndUpdatesRounded />,
    title: 'AI-Powered Feedback',
    description:
      'Get actionable suggestions to make your resume clearer and more effective.',
  },
  {
    icon: <DescriptionOutlined />,
    title: 'Skills Insights',
    description:
      'Identify relevant skills and understand how your experience supports your goals.',
  },
];

function App() {
  const [showUpload, setShowUpload] = useState(false);

  if (showUpload) {
    return <ResumeUpload onBack={() => setShowUpload(false)} />;
  }
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', color: '#172033' }}>
      {/* Navigation */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.96)',
          color: '#172033',
          borderBottom: '1px solid #E8EDF4',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 76, gap: 2 }}>
            <AutoAwesomeRounded
              sx={{ color: '#635BFF', fontSize: 32 }}
            />

            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: '-1px', flexGrow: 1 }}
            >
              Resume<span style={{ color: '#635BFF' }}>IQ</span>
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <Button color="inherit">Features</Button>
              <Button color="inherit">How it works</Button>
            </Stack>

            <Button
              variant="contained"
              endIcon={<ArrowForwardRounded />}
              sx={{
                bgcolor: '#635BFF',
                borderRadius: 2,
                px: { xs: 1.5, sm: 2.5 },
                py: 1.2,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#5046E5' },
              }}
              onClick={() => setShowUpload(true)}
            >
              Get Started
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            alignItems: 'center',
            gap: { xs: 5, md: 8 },
            py: { xs: 7, md: 12 },
          }}
        >
          <Box>
            <Chip
              icon={<AutoAwesomeRounded sx={{ fontSize: 17 }} />}
              label="Your career, powered by AI"
              sx={{
                bgcolor: '#EEEDFF',
                color: '#5145CD',
                fontWeight: 700,
                mb: 3,
                px: 1,
                py: 2.5,
              }}
            />

            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2.7rem', sm: '3.5rem', md: '4rem' },
                fontWeight: 850,
                letterSpacing: '-2px',
                lineHeight: 1.12,
                mb: 3,
              }}
            >
              Your resume deserves
              <Box component="span" sx={{ color: '#635BFF' }}>
                {' '}to stand out.
              </Box>
            </Typography>

            <Typography
              sx={{
                color: '#64748B',
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.9,
                maxWidth: 530,
                mb: 4,
              }}
            >
              Get AI-assisted insights into your resume, discover opportunities
              to improve, and take the next step in your career with confidence.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRounded />}
                sx={{
                  bgcolor: '#635BFF',
                  borderRadius: 2.5,
                  py: 1.7,
                  px: 3,
                  textTransform: 'none',
                  fontSize: 16,
                  fontWeight: 700,
                  boxShadow: '0 8px 22px rgba(99,91,255,0.22)',
                  '&:hover': { bgcolor: '#5046E5' },
                }}
                onClick={() => setShowUpload(true)}
              >
                Analyze My Resume
              </Button>

              <Button
                size="large"
                sx={{
                  color: '#334155',
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Explore Features
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 3, color: '#64748B' }}
            >
              <SecurityRounded sx={{ fontSize: 19, color: '#16A34A' }} />

              <Typography variant="body2">
                Your career journey starts here.
              </Typography>
            </Stack>
          </Box>

          {/* Resume Analysis Preview */}
          <Card
            elevation={0}
            sx={{
              border: '1px solid #E5EAF2',
              borderRadius: 4,
              bgcolor: '#FFFFFF',
              boxShadow: '0 24px 70px rgba(31,41,55,0.08)',
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
<Stack
  direction="row"
  justifyContent="space-between"
  alignItems="center"
  mb={4}
>
  <Box>
    <Typography variant="h6" fontWeight={800}>
      Resume Overview
    </Typography>

    <Typography variant="body2" color="text.secondary">
      Sample analysis preview
    </Typography>
  </Box>
</Stack>

              <Box
                sx={{
                  p: 2.5,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E8EDF4',
                  borderRadius: 3,
                  mb: 3,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      bgcolor: '#E5E7FF',
                      color: '#635BFF',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <DescriptionOutlined fontSize="large" />
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>
                      My_Resume.pdf
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Sample document
                    </Typography>
                  </Box>

                  <CheckCircleRounded sx={{ color: '#16A34A' }} />
                </Stack>
              </Box>

              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Example score visualization
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Typography
                  sx={{
                    fontSize: '3rem',
                    fontWeight: 850,
                    color: '#635BFF',
                    letterSpacing: '-2px',
                  }}
                >
                  85
                </Typography>

                <Box>
                  <Typography fontWeight={700}>
                    Resume score
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Illustrative example
                  </Typography>
                </Box>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={85}
                sx={{
                  height: 9,
                  borderRadius: 5,
                  bgcolor: '#E9E7FF',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#635BFF',
                    borderRadius: 5,
                  },
                }}
              />

              <Stack spacing={2.5} sx={{ mt: 4 }}>
                {[
                  { label: 'Experience', value: 90 },
                  { label: 'Skills', value: 82 },
                  { label: 'Presentation', value: 78 },
                ].map((item) => (
                  <Box key={item.label}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 1 }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: '#334155' }}
                      >
                        {item.label}
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: '#64748B', flexShrink: 0 }}
                      >
                        {item.value}%
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={item.value}
                      sx={{
                        height: 7,
                        borderRadius: 5,
                        bgcolor: '#EEF2F7',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#8B83FF',
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 3 }}
              >
                Illustrative interface only. Real scores will require
                implemented analysis logic.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: '#FFFFFF', borderTop: '1px solid #E8EDF4' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
          <Box sx={{ textAlign: 'center', maxWidth: 650, mx: 'auto', mb: 6 }}>
            <Typography
              sx={{
                color: '#635BFF',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                fontSize: 13,
                mb: 2,
              }}
            >
              Built for your next opportunity
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '2rem', md: '2.7rem' },
                fontWeight: 800,
                letterSpacing: '-1.2px',
                mb: 2,
              }}
            >
              More than just a resume checker.
            </Typography>

            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Get a clearer understanding of your resume and discover practical
              ways to present your experience more effectively.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
              gap: { xs: 2, md: 3 },
              alignItems: 'stretch',
            }}
          >
            {features.map((feature) => (
              <Card
                key={feature.title}
                elevation={0}
                sx={{
                  border: '1px solid #E8EDF4',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 36px rgba(31,41,55,0.07)',
                  },
                }}
              >
                  <CardContent
                    sx={{
                      p: { xs: 2.5, sm: 3.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      height: '100%',
                      '&:last-child': {
                        pb: { xs: 2.5, sm: 3.5 },
                      },
                    }}
                  >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      bgcolor: '#EEEDFF',
                      color: '#635BFF',
                      display: 'grid',
                      placeItems: 'center',
                      mb: 3,
                      '& svg': { fontSize: 28 },
                    }}
                  >
                    {feature.icon}
                  </Box>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      mb: 1.5,
                      lineHeight: 1.35,
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.8,
                      fontSize: '0.98rem',
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Call to Action */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Box
          sx={{
            bgcolor: '#635BFF',
            color: '#FFFFFF',
            borderRadius: { xs: 3, md: 5 },
            px: { xs: 3, md: 7 },
            py: { xs: 5, md: 7 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          <Box sx={{ maxWidth: 600 }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 800,
                letterSpacing: '-1px',
                mb: 2,
              }}
            >
              Ready to take the next step?
            </Typography>

            <Typography sx={{ color: '#E5E4FF', lineHeight: 1.8 }}>
              Start building a stronger resume with thoughtful,
              AI-assisted feedback.
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<CloudUploadOutlined />}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#5145CD',
              borderRadius: 2.5,
              py: 1.8,
              px: 3,
              fontWeight: 800,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#F0EFFF' },
            }}
            onClick={() => setShowUpload(true)}
          >
            Upload Your Resume
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#FFFFFF', borderTop: '1px solid #E8EDF4' }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            sx={{ py: 3 }}
          >
            <Typography fontWeight={800}>
              Resume<span style={{ color: '#635BFF' }}>IQ</span>
            </Typography>

            <Typography variant="body2" color="text.secondary">
              AI-assisted resume improvement.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} ResumeIQ
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default App;