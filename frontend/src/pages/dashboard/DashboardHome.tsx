import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';

import { apiRequest } from '../../services/api';

/* --------------------------------------------------
   TYPES
-------------------------------------------------- */

interface Resume {
  resumeId: string;
  resumeTitle: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadDate: string;
}

interface ResumeListResponse {
  success: boolean;
  message?: string;
  resumes: Resume[];
}

interface AnalysisHistoryItem {
  analysisId: string;
  resumeId: string;
  resumeTitle: string;
  analysisType: 'general' | 'job_specific';
  jobId: string | null;
  overallScore: number;
  atsScore: number;
  matchScore: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AnalysisHistoryPayload {
  analyses?: AnalysisHistoryItem[];
  pagination?: Pagination;
}

interface AnalysisHistoryResponse extends AnalysisHistoryPayload {
  success?: boolean;
  message?: string;
  data?: AnalysisHistoryPayload;
  history?: AnalysisHistoryPayload;
}

interface AnalysisResultPayload {
  result?: Record<string, unknown> | null;
}

interface AnalysisResultResponse extends AnalysisResultPayload {
  success?: boolean;
  data?: AnalysisResultPayload;
  analysis?: AnalysisResultPayload;
}

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

function formatDate(date: string): string {
  if (!date) return 'Date unavailable';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatScore(score: number | null): string {
  if (score === null || !Number.isFinite(score)) {
    return '—';
  }

  return `${Number(score.toFixed(1))}%`;
}

function getSkillName(skill: unknown): string | null {
  if (typeof skill === 'string') {
    return skill.trim() || null;
  }

  if (typeof skill === 'object' && skill !== null) {
    const item = skill as Record<string, unknown>;

    const possibleNames = [
      item.skillName,
      item.name,
      item.skill,
    ];

    const name = possibleNames.find(
      (value) =>
        typeof value === 'string' && value.trim().length > 0,
    );

    return typeof name === 'string' ? name.trim() : null;
  }

  return null;
}

function getUniqueSkillCount(
  result: Record<string, unknown> | null,
): number {
  if (!result) return 0;

  const technicalSkills = Array.isArray(result.technicalSkills)
    ? result.technicalSkills
    : [];

  const softSkills = Array.isArray(result.softSkills)
    ? result.softSkills
    : [];

  const allSkills = [...technicalSkills, ...softSkills];

  const uniqueSkills = new Set(
    allSkills
      .map(getSkillName)
      .filter((skill): skill is string => Boolean(skill))
      .map((skill) => skill.toLowerCase()),
  );

  return uniqueSkills.size;
}

/* --------------------------------------------------
   COMPONENT
-------------------------------------------------- */

function DashboardHome() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [totalResumes, setTotalResumes] = useState(0);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [jobMatches, setJobMatches] = useState(0);
  const [skillsIdentified, setSkillsIdentified] = useState(0);

  const [latestScore, setLatestScore] = useState<number | null>(null);

  const [recentAnalyses, setRecentAnalyses] = useState<
    AnalysisHistoryItem[]
  >([]);

  /* --------------------------------------------------
     LOAD DASHBOARD DATA
  -------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [resumeResponse, historyResponse] = await Promise.all([
          apiRequest<ResumeListResponse>('/resumes'),

          apiRequest<AnalysisHistoryResponse>(
            '/analysis?page=1&limit=5',
          ),
        ]);

        if (cancelled) return;

        // Resume statistics
        const resumes = Array.isArray(resumeResponse.resumes)
          ? resumeResponse.resumes
          : [];

        setTotalResumes(resumes.length);

        // Handle direct or wrapped history responses
        const historyPayload =
          historyResponse.data ??
          historyResponse.history ??
          historyResponse;

        const analyses = Array.isArray(historyPayload.analyses)
          ? historyPayload.analyses
          : [];

        const pagination = historyPayload.pagination;

        setRecentAnalyses(analyses);

        // Total analysis count
        setTotalAnalyses(
          typeof pagination?.total === 'number'
            ? pagination.total
            : analyses.length,
        );

        // Count job-specific analyses in the latest five records
        setJobMatches(
          analyses.filter(
            (analysis) => analysis.analysisType === 'job_specific',
          ).length,
        );

        // Latest analysis score and extracted skills
        if (analyses.length > 0) {
          setLatestScore(Number(analyses[0].overallScore));

          try {
            const latestAnalysis =
              await apiRequest<AnalysisResultResponse>(
                `/analysis/${analyses[0].analysisId}`,
              );

            if (cancelled) return;

            const detail =
              latestAnalysis.data ??
              latestAnalysis.analysis ??
              latestAnalysis;

            setSkillsIdentified(
              getUniqueSkillCount(detail.result ?? null),
            );
          } catch {
            setSkillsIdentified(0);
          }
        } else {
          setLatestScore(null);
          setSkillsIdentified(0);
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load dashboard information.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  /* --------------------------------------------------
     STATISTICS
  -------------------------------------------------- */

  const statistics = [
    {
      title: 'Total Resumes',
      value: totalResumes.toString().padStart(2, '0'),
      subtitle: 'Uploaded resumes',
      icon: <DescriptionRounded />,
      color: '#635BFF',
      background: '#EEEDFF',
    },
    {
      title: 'Analyses Completed',
      value: totalAnalyses.toString().padStart(2, '0'),
      subtitle: 'Resume analyses',
      icon: <AnalyticsRounded />,
      color: '#0891B2',
      background: '#E0F7FA',
    },
    {
      title: 'Job-Specific Analyses',
      value: jobMatches.toString().padStart(2, '0'),
      subtitle: 'From latest 5 analyses',
      icon: <WorkOutlineRounded />,
      color: '#16A34A',
      background: '#DCFCE7',
    },
    {
      title: 'Skills Identified',
      value: skillsIdentified.toString().padStart(2, '0'),
      subtitle: 'From latest analysis',
      icon: <PsychologyRounded />,
      color: '#D97706',
      background: '#FEF3C7',
    },
  ];

  /* --------------------------------------------------
     LOADING STATE
  -------------------------------------------------- */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <CircularProgress sx={{ color: '#635BFF' }} />

        <Typography color="text.secondary" fontSize={13}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  /* --------------------------------------------------
     MAIN DASHBOARD
  -------------------------------------------------- */

  return (
    <Box sx={{ pb: 2 }}>
      {/* Welcome Section */}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography color="text.secondary" fontSize={13}>
            Track your resume performance and career progress.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddRounded />}
          onClick={() => navigate('/upload-resume')}
          sx={{
            bgcolor: '#635BFF',
            borderRadius: 2,
            px: 2,
            py: 0.9,
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {statistics.map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item.title}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #E8EDF4',
                borderRadius: 2.5,
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      sx={{
                        color: '#64748B',
                        fontSize: 12,
                        fontWeight: 650,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 25,
                        fontWeight: 800,
                        color: '#172033',
                        mt: 0.7,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.value}
                    </Typography>

                    <Typography
                      sx={{
                        color: '#94A3B8',
                        fontSize: 11,
                        mt: 0.4,
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: item.color,
                      bgcolor: item.background,
                      flexShrink: 0,
                      '& svg': {
                        fontSize: 21,
                      },
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

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={7}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #E8EDF4',
              borderRadius: 2.5,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="subtitle1" fontWeight={750}>
                Resume Performance
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 12, mt: 0.5, mb: 2 }}
              >
                Your latest resume quality score.
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2.5}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 38,
                      fontWeight: 850,
                      color: '#635BFF',
                      lineHeight: 1.2,
                      letterSpacing: '-1px',
                    }}
                  >
                    {formatScore(latestScore)}
                  </Typography>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.4}
                  >
                    <TrendingUpRounded
                      sx={{ color: '#16A34A', fontSize: 15 }}
                    />

                    <Typography
                      sx={{
                        color: '#16A34A',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Latest analysis
                    </Typography>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    width: '1px',
                    height: 55,
                    bgcolor: '#E8EDF4',
                    flexShrink: 0,
                  }}
                />

                <Box>
                  <Typography fontWeight={700} fontSize={13}>
                    Resume quality
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: 11, mt: 0.4 }}
                  >
                    Based on your latest analysis
                  </Typography>
                </Box>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={Math.min(Math.max(latestScore ?? 0, 0), 100)}
                sx={{
                  height: 8,
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
                sx={{ fontSize: 11, mt: 1.5 }}
              >
                {latestScore === null
                  ? 'Complete your first resume analysis to see your score.'
                  : 'This score represents your most recently analyzed resume.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #E8EDF4',
              borderRadius: 2.5,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                variant="subtitle1"
                fontWeight={750}
                sx={{ mb: 1.5 }}
              >
                Quick Actions
              </Typography>

              <Stack spacing={1}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  startIcon={<CloudUploadRounded />}
                  onClick={() => navigate('/upload-resume')}
                  sx={{
                    justifyContent: 'flex-start',
                    bgcolor: '#635BFF',
                    py: 1.1,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#5046E5' },
                  }}
                >
                  Upload New Resume
                </Button>

                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<WorkOutlineRounded />}
                  onClick={() => navigate('/jobs')}
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#475569',
                    borderColor: '#E2E8F0',
                    py: 1.1,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Add Job Description
                </Button>

                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<AutoAwesomeRounded />}
                  onClick={() => navigate('/analysis')}
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#475569',
                    borderColor: '#E2E8F0',
                    py: 1.1,
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

      {/* Recent Analyses */}

      <Card
        elevation={0}
        sx={{
          border: '1px solid #E8EDF4',
          borderRadius: 2.5,
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={750}>
                Recent Analyses
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 12, mt: 0.3 }}
              >
                Your latest resume analysis activities.
              </Typography>
            </Box>

            <Button
              size="small"
              endIcon={<ArrowForwardRounded />}
              onClick={() => navigate('/history')}
              sx={{
                color: '#635BFF',
                textTransform: 'none',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              View All
            </Button>
          </Stack>

          {recentAnalyses.length === 0 ? (
            <Box
              sx={{
                py: 3,
                textAlign: 'center',
              }}
            >
              <AnalyticsRounded
                sx={{ fontSize: 36, color: '#CBD5E1', mb: 0.5 }}
              />

              <Typography fontWeight={700} color="#475569" fontSize={14}>
                No analyses yet
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 12, mt: 0.5, mb: 1.5 }}
              >
                Upload a resume and complete your first analysis.
              </Typography>

              <Button
                size="small"
                variant="contained"
                onClick={() => navigate('/analysis')}
                sx={{
                  bgcolor: '#635BFF',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#5046E5' },
                }}
              >
                Start Analysis
              </Button>
            </Box>
          ) : (
            <Stack spacing={0}>
              {recentAnalyses.map((activity, index) => (
                <Box
                  key={activity.analysisId}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 1.5,
                    py: 1.5,
                    borderBottom:
                      index !== recentAnalyses.length - 1
                        ? '1px solid #F1F5F9'
                        : 'none',
                  }}
                >
                  <Box>
                    <Typography fontWeight={700} sx={{ fontSize: 13 }}>
                      {activity.resumeTitle}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 11, mt: 0.4 }}
                    >
                      {activity.analysisType === 'job_specific'
                        ? 'Job-specific analysis'
                        : 'General resume analysis'}
                      {' • '}
                      {formatDate(activity.createdAt)}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                  >
                    <Chip
                      label="Completed"
                      size="small"
                      sx={{
                        height: 23,
                        bgcolor: '#DCFCE7',
                        color: '#15803D',
                        fontWeight: 700,
                        fontSize: 10,
                      }}
                    />

                    <Typography
                      sx={{
                        color: '#635BFF',
                        fontWeight: 800,
                        fontSize: 14,
                        minWidth: 55,
                        textAlign: 'right',
                      }}
                    >
                      {formatScore(Number(activity.overallScore))}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Live Data Notice */}

      <Box sx={{ mt: 2 }}>
        <Chip
          label="Live data — connected to your account"
          size="small"
          sx={{
            height: 24,
            bgcolor: '#DCFCE7',
            color: '#15803D',
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      </Box>
    </Box>
  );
}

export default DashboardHome;