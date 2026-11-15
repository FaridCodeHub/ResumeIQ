import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  AnalyticsRounded,
  SearchRounded,
  DescriptionRounded,
  CalendarMonthRounded,
  TrendingUpRounded,
  ArrowForwardRounded,
  FilterListRounded,
  RefreshRounded,
} from '@mui/icons-material';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { apiRequest } from '../services/api';

/* --------------------------------------------------
   TYPES
-------------------------------------------------- */

interface Analysis {
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

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AnalysisHistoryPayload {
  analyses?: Analysis[];
  pagination?: PaginationData;
}

interface AnalysisHistoryResponse extends AnalysisHistoryPayload {
  success?: boolean;
  message?: string;
  data?: AnalysisHistoryPayload;
  history?: AnalysisHistoryPayload;
}

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatScore = (score: number | null | undefined) => {
  if (
    score === null ||
    score === undefined ||
    !Number.isFinite(Number(score))
  ) {
    return '—';
  }

  return `${Number(Number(score).toFixed(1))}%`;
};

const getScoreColor = (score: number) => {
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#D97706';
  return '#DC2626';
};


/* --------------------------------------------------
   STAT CARD
-------------------------------------------------- */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  background,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  background: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid #E9EDF5',
        borderRadius: 3,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box>
            <Typography
              color="text.secondary"
              fontSize={13}
              fontWeight={600}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={800}
              color="#172033"
              sx={{ mt: 1.2 }}
            >
              {value}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={12}
              sx={{ mt: 0.8 }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Avatar
            variant="rounded"
            sx={{
              width: 46,
              height: 46,
              bgcolor: background,
              color,
              borderRadius: 2.5,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------
   SCORE INDICATOR
-------------------------------------------------- */

function ScoreIndicator({ score }: { score: number }) {
  const safeScore = Number.isFinite(Number(score))
    ? Math.min(Math.max(Number(score), 0), 100)
    : 0;

  return (
    <Stack spacing={0.7} sx={{ minWidth: 90 }}>
      <Stack direction="row" alignItems="center" spacing={0.7}>
        <Typography
          fontSize={14}
          fontWeight={800}
          color={getScoreColor(safeScore)}
        >
          {formatScore(safeScore)}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={safeScore}
        sx={{
          height: 5,
          borderRadius: 5,
          bgcolor: '#EEF0F5',
          '& .MuiLinearProgress-bar': {
            bgcolor: getScoreColor(safeScore),
            borderRadius: 5,
          },
        }}
      />
    </Stack>
  );
}

/* --------------------------------------------------
   COMPONENT
-------------------------------------------------- */

export default function AnalysisHistory() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [analysisType, setAnalysisType] = useState('all');

  /* --------------------------------------------------
     FETCH HISTORY
  -------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError('');

      try {
        const response = await apiRequest<AnalysisHistoryResponse>(
          `/analysis?page=${pagination.page}&limit=${pagination.limit}`,
        );

        if (cancelled) return;

        const payload =
          response.data ??
          response.history ??
          response;

        setAnalyses(
          Array.isArray(payload.analyses)
            ? payload.analyses
            : [],
        );

        setPagination((previous) => ({
          ...previous,
          ...(payload.pagination ?? {}),
        }));
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load analysis history.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [pagination.page, pagination.limit]);

  /* --------------------------------------------------
     FILTER
  -------------------------------------------------- */

  const filteredAnalyses = analyses.filter((analysis) => {
    const title = analysis.resumeTitle || '';

    const matchesSearch = title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesType =
      analysisType === 'all' ||
      analysis.analysisType === analysisType;

    return matchesSearch && matchesType;
  });

  /* --------------------------------------------------
     STATISTICS
  -------------------------------------------------- */

  const averageScore =
    analyses.length > 0
      ? analyses.reduce(
          (total, item) => total + Number(item.overallScore || 0),
          0,
        ) / analyses.length
      : 0;

  const jobSpecificCount = analyses.filter(
    (item) => item.analysisType === 'job_specific',
  ).length;

  /* --------------------------------------------------
     MAIN PAGE
  -------------------------------------------------- */

  return (
    <Box sx={{ pb: 4 }}>
      {/* Intro - no repeated page heading */}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography color="text.secondary" fontSize={14}>
            Track your progress and see how your resume improves over time.
          </Typography>
        </Box>

        <Button
          variant="contained"
          endIcon={<ArrowForwardRounded />}
          onClick={() => navigate('/analysis')}
          sx={{
            bgcolor: '#635BFF',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            px: 2.5,
            py: 1.1,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#5046E5',
              boxShadow: 'none',
            },
          }}
        >
          New Analysis
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* STATISTICS */}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Analyses"
            value={pagination.total}
            subtitle="Completed resume analyses"
            icon={<AnalyticsRounded />}
            color="#635BFF"
            background="#EEEDFF"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Average Resume Score"
            value={analyses.length ? formatScore(averageScore) : '—'}
            subtitle="Average on this page"
            icon={<TrendingUpRounded />}
            color="#0891B2"
            background="#E0F7FA"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Job-Specific Analyses"
            value={jobSpecificCount}
            subtitle="On this page"
            icon={<DescriptionRounded />}
            color="#16A34A"
            background="#DCFCE7"
          />
        </Grid>
      </Grid>

      {/* HISTORY CONTENT */}

      <Paper
        elevation={0}
        sx={{
          border: '1px solid #E9EDF5',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Section toolbar */}

        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderBottom: '1px solid #EEF0F5',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography fontWeight={800} fontSize={17} color="#172033">
                Previous Analyses
              </Typography>

              <Typography color="text.secondary" fontSize={12} sx={{ mt: 0.4 }}>
                {pagination.total} analyses available
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.2}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <TextField
                size="small"
                placeholder="Search resumes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{
                  width: { xs: '100%', sm: 230 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#FAFBFD',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded
                        sx={{ color: '#94A3B8', fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                size="small"
                value={analysisType}
                onChange={(event) => setAnalysisType(event.target.value)}
                sx={{
                  minWidth: { xs: '100%', sm: 175 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#FAFBFD',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterListRounded
                        sx={{ color: '#94A3B8', fontSize: 19 }}
                      />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="all">All Analyses</MenuItem>
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="job_specific">Job-Specific</MenuItem>
              </TextField>

              <Button
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setAnalysisType('all');
                }}
                sx={{
                  minWidth: 42,
                  borderRadius: 2,
                  textTransform: 'none',
                }}
                title="Reset filters"
              >
                <RefreshRounded />
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Loading */}

        {loading && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress size={30} />
            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{ mt: 1.5 }}
            >
              Loading analyses...
            </Typography>
          </Box>
        )}

        {/* Empty state */}

        {!loading && filteredAnalyses.length === 0 && (
          <Box sx={{ py: 7, px: 2, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 58,
                height: 58,
                bgcolor: '#F1F0FF',
                color: '#635BFF',
                mx: 'auto',
                mb: 2,
              }}
            >
              <AnalyticsRounded fontSize="large" />
            </Avatar>

            <Typography fontWeight={700} color="#172033">
              No analyses found
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{ mt: 0.7, mb: 2 }}
            >
              {search || analysisType !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Your completed resume analyses will appear here.'}
            </Typography>

            {!search && analysisType === 'all' && (
              <Button
                variant="contained"
                onClick={() => navigate('/analysis')}
                sx={{
                  bgcolor: '#635BFF',
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                Start Your First Analysis
              </Button>
            )}
          </Box>
        )}

        {/* DESKTOP TABLE */}

        {!loading && filteredAnalyses.length > 0 && !isMobile && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: '#FAFBFD',
                    '& th': {
                      color: '#64748B',
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      py: 1.8,
                      borderBottom: '1px solid #EEF0F5',
                    },
                  }}
                >
                  <TableCell>Resume</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Overall Score</TableCell>
                  <TableCell>ATS Score</TableCell>
                  <TableCell>Match Score</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right"> </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredAnalyses.map((analysis) => (
                  <TableRow
                    key={analysis.analysisId}
                    hover
                    sx={{
                      '& td': {
                        borderBottom: '1px solid #F1F5F9',
                        py: 2,
                      },
                      '&:last-child td': {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: '#F1F0FF',
                            color: '#635BFF',
                          }}
                        >
                          <DescriptionRounded fontSize="small" />
                        </Avatar>

                        <Box>
                          <Typography
                            fontSize={13}
                            fontWeight={700}
                            color="#172033"
                          >
                            {analysis.resumeTitle || 'Untitled Resume'}
                          </Typography>

                          <Typography
                            fontSize={11}
                            color="text.secondary"
                          >
                            Resume analysis
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          analysis.analysisType === 'job_specific'
                            ? 'Job-specific'
                            : 'General'
                        }
                        sx={{
                          bgcolor:
                            analysis.analysisType === 'job_specific'
                              ? '#E0F7FA'
                              : '#EEEDFF',
                          color:
                            analysis.analysisType === 'job_specific'
                              ? '#0E7490'
                              : '#635BFF',
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <ScoreIndicator
                        score={Number(analysis.overallScore || 0)}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={13} fontWeight={600}>
                        {formatScore(analysis.atsScore)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={13} fontWeight={600}>
                        {formatScore(analysis.matchScore)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <CalendarMonthRounded
                          sx={{ fontSize: 16, color: '#94A3B8' }}
                        />

                        <Typography fontSize={12} color="text.secondary">
                          {formatDate(analysis.createdAt)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="small"
                        endIcon={<ArrowForwardRounded />}
                        onClick={() =>
                          navigate(`/analysis/${analysis.analysisId}`)
                        }
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#635BFF',
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* MOBILE CARDS */}

        {!loading && filteredAnalyses.length > 0 && isMobile && (
          <Stack spacing={0} divider={<Box sx={{ borderBottom: '1px solid #EEF0F5' }} />}>
            {filteredAnalyses.map((analysis) => (
              <Box key={analysis.analysisId} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: '#F1F0FF',
                        color: '#635BFF',
                        width: 40,
                        height: 40,
                      }}
                    >
                      <DescriptionRounded />
                    </Avatar>

                    <Box>
                      <Typography fontWeight={700} fontSize={13}>
                        {analysis.resumeTitle || 'Untitled Resume'}
                      </Typography>

                      <Typography color="text.secondary" fontSize={11}>
                        {formatDate(analysis.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    size="small"
                    label={
                      analysis.analysisType === 'job_specific'
                        ? 'Job-specific'
                        : 'General'
                    }
                    sx={{
                      bgcolor: '#EEEDFF',
                      color: '#635BFF',
                      fontWeight: 700,
                      fontSize: 10,
                    }}
                  />
                </Stack>

                <Grid container spacing={1.5} sx={{ mt: 1 }}>
                  {[
                    ['Overall', analysis.overallScore],
                    ['ATS', analysis.atsScore],
                    ['Match', analysis.matchScore],
                  ].map(([label, value]) => (
                    <Grid item xs={4} key={String(label)}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: '#FAFBFD',
                          borderColor: '#EEF0F5',
                        }}
                      >
                        <Typography color="text.secondary" fontSize={10}>
                          {label}
                        </Typography>

                        <Typography
                          fontWeight={800}
                          fontSize={15}
                          sx={{
                            mt: 0.4,
                            color: getScoreColor(Number(value || 0)),
                          }}
                        >
                          {formatScore(Number(value || 0))}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardRounded />}
                  onClick={() =>
                    navigate(`/analysis/${analysis.analysisId}`)
                  }
                  sx={{
                    mt: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  View Analysis
                </Button>
              </Box>
            ))}
          </Stack>
        )}

        {/* PAGINATION */}

        {!loading && pagination.totalPages > 1 && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #EEF0F5',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_, page) => {
                setPagination((previous) => ({
                  ...previous,
                  page,
                }));
              }}
              color="primary"
              size={isMobile ? 'small' : 'medium'}
            />
          </Box>
        )}
      </Paper>

      {/* Footer info */}

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.8}
        sx={{ mt: 2 }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: '#16A34A',
          }}
        />

        <Typography color="text.secondary" fontSize={11}>
          Your analysis history is synced with your account.
        </Typography>
      </Stack>
    </Box>
  );
}