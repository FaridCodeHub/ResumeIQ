import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  ArrowBackRounded,
  AutoAwesomeRounded,
  CheckCircleRounded,
  ErrorOutlineRounded,
  LightbulbRounded,
  PsychologyRounded,
  SchoolRounded,
  TrendingUpRounded,
  WorkOutlineRounded,
  DescriptionRounded,
  CalendarMonthRounded,
  ArrowForwardRounded,
} from '@mui/icons-material';

import { apiRequest } from '../services/api';

interface AnalysisDetails {
  analysisId: string;
  resumeId: string;
  resumeTitle?: string;
  analysisType: string;
  overallScore?: number;
  matchScore?: number;
  createdAt: string;

  scores?: {
    overallScore: number;
    matchScore: number;
    confidenceScore: number;
    ats: {
      atsScore: number;
      keywordScore: number;
      formattingScore: number;
      structureScore: number;
      scoringBreakdown?: Record<string, any>;
    };
  };

  result: Record<string, any>;
  atsAnalysis?: Record<string, any>;
  recommendations?: any[];
  careerRecommendations?: any[];
  skillGaps?: any[];
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'info';
  if (score >= 40) return 'warning';
  return 'error';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
};

const formatDate = (date: string) => {
  if (!date) return 'Not available';

  return new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const surfaceStyle = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 3px 15px rgba(15, 23, 42, 0.035)',
  bgcolor: 'background.paper',
};

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Avatar
        variant="rounded"
        sx={{
          width: 44,
          height: 44,
          bgcolor: 'primary.50',
          color: 'primary.main',
          borderRadius: 2.5,
        }}
      >
        {icon}
      </Avatar>

      <Box>
        <Typography variant="subtitle1" fontWeight={750}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

function ScoreCard({
  title,
  score,
  description,
  icon,
}: {
  title: string;
  score: number;
  description: string;
  icon: React.ReactNode;
}) {
  const color = getScoreColor(score);

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography fontWeight={650} color="text.secondary">
            {title}
          </Typography>

          <Avatar
            variant="rounded"
            sx={{
              width: 42,
              height: 42,
              bgcolor: 'primary.50',
              color: 'primary.main',
              borderRadius: 2,
            }}
          >
            {icon}
          </Avatar>
        </Stack>

        <Stack direction="row" alignItems="baseline" spacing={0.7} mt={2}>
          <Typography
            sx={{
              fontSize: { xs: 36, sm: 42 },
              fontWeight: 850,
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            {Math.round(score)}
          </Typography>

          <Typography color="text.secondary" fontWeight={600}>
            / 100
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={Math.min(Math.max(score, 0), 100)}
          color={color}
          sx={{
            height: 7,
            borderRadius: 5,
            mt: 2,
            mb: 1,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
            },
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Chip
            size="small"
            color={color}
            label={getScoreLabel(score)}
            sx={{ fontWeight: 650 }}
          />

          <Typography variant="caption" color="text.secondary">
            {score}/100
          </Typography>
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card
      sx={{
        ...surfaceStyle,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {children}
      </CardContent>
    </Card>
  );
}

function ScoreBreakdown({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const color = getScoreColor(value);

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography fontWeight={600} variant="body2">
          {label}
        </Typography>

        <Typography fontWeight={750} variant="body2">
          {value}
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
          >
            {' '}
            / 100
          </Typography>
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.min(Math.max(value, 0), 100)}
        color={color}
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
          },
        }}
      />
    </Box>
  );
}

function TextList({
  items,
  type = 'success',
}: {
  items: any[];
  type?: 'success' | 'error';
}) {
  if (!items?.length) {
    return (
      <Typography color="text.secondary" variant="body2">
        No information available.
      </Typography>
    );
  }

  const isSuccess = type === 'success';

  return (
    <Stack spacing={2}>
      {items.map((item, index) => {
        const text =
          typeof item === 'string'
            ? item
            : item?.description ||
              item?.text ||
              item?.name ||
              item?.recommendation ||
              item?.title ||
              '';

        if (!text) return null;

        return (
          <Stack
            key={index}
            direction="row"
            spacing={1.5}
            alignItems="flex-start"
          >
            <Avatar
              sx={{
                width: 25,
                height: 25,
                bgcolor: isSuccess ? 'success.50' : 'error.50',
                color: isSuccess ? 'success.main' : 'error.main',
              }}
            >
              {isSuccess ? (
                <CheckCircleRounded sx={{ fontSize: 16 }} />
              ) : (
                <ErrorOutlineRounded sx={{ fontSize: 16 }} />
              )}
            </Avatar>

            <Typography
              variant="body2"
              sx={{ lineHeight: 1.7, pt: 0.3 }}
            >
              {text}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

export default function ResumeAnalysis() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<AnalysisDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId) {
        setError('Analysis ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await apiRequest<any>(
          `/analysis/${analysisId}`
        );

        const data =
          response?.analysis ??
          response?.data?.analysis ??
          response?.data ??
          response;

        setAnalysis(data as AnalysisDetails);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load analysis results.';

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={38} />

          <Typography color="text.secondary" fontWeight={500}>
            Preparing your analysis report...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !analysis) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate('/history')}
          sx={{ mb: 3 }}
        >
          Back to Analysis History
        </Button>

        <Alert severity="error">
          {error || 'Analysis results could not be found.'}
        </Alert>
      </Box>
    );
  }

  const result = analysis.result || {};

  const ats =
    analysis.scores?.ats ??
    analysis.atsAnalysis ??
    result.atsAnalysis ??
    {};

  const overallScore = Number(
    analysis.scores?.overallScore ??
      analysis.overallScore ??
      result.resumeQuality?.overallScore ??
      0
  );

  const atsScore = Number(ats.atsScore ?? 0);

  const technicalSkills = result.technicalSkills || [];
  const softSkills = result.softSkills || [];
  const strengths = result.strengths || [];
  const weaknesses = result.weaknesses || [];

  const recommendations =
    analysis.recommendations || result.recommendations || [];

  const careerRecommendations =
    analysis.careerRecommendations ||
    result.careerRecommendations ||
    [];

  const skillGaps = analysis.skillGaps || [];

  const skillName = (skill: any) =>
    typeof skill === 'string'
      ? skill
      : skill?.skillName || skill?.name || skill?.skill || 'Unknown skill';

  const scoringBreakdown = [
    {
      label: 'Keyword Score',
      value: Number(ats.keywordScore ?? 0),
    },
    {
      label: 'Formatting Score',
      value: Number(ats.formattingScore ?? 0),
    },
    {
      label: 'Structure Score',
      value: Number(ats.structureScore ?? 0),
    },
  ];

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top navigation */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate('/history')}
          sx={{
            fontWeight: 650,
            px: 0,
          }}
        >
          Analysis History
        </Button>

        <Chip
          icon={<AutoAwesomeRounded />}
          label="AI Generated Report"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      {/* Hero section */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          mb: 3,
          p: { xs: 2.5, sm: 3 },
          color: '#fff',
          background:
            'linear-gradient(120deg, #142B55 0%, #214B83 55%, #3275B8 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            right: -70,
            top: -110,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
            right: 100,
            bottom: -130,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            mb={2}
          >
            <AutoAwesomeRounded sx={{ fontSize: 19 }} />

            <Typography
              variant="overline"
              sx={{
                fontWeight: 750,
                letterSpacing: 1.5,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              RESUME ANALYSIS REPORT
            </Typography>
          </Stack>

          <Typography
            variant="h4"
            fontWeight={850}
            sx={{
              fontSize: { xs: 23, sm: 29 },
              letterSpacing: '-0.8px',
              mb: 1,
            }}
          >
            Your Resume Insights
          </Typography>

          <Typography
            sx={{
              color: 'rgba(255,255,255,0.78)',
              maxWidth: 600,
              lineHeight: 1.7,
            }}
          >
            Here's a detailed breakdown of your resume performance,
            strengths and opportunities for improvement.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1.5, sm: 3 }}
            mt={2}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <DescriptionRounded sx={{ fontSize: 19 }} />

              <Typography variant="body2" fontWeight={600}>
                {analysis.resumeTitle || 'Resume Analysis'}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthRounded sx={{ fontSize: 19 }} />

              <Typography variant="body2">
                {formatDate(analysis.createdAt)}
              </Typography>
            </Stack>
          </Stack>

          <Box mt={2}>
            <Chip
              size="small"
              label={
                analysis.analysisType === 'job_specific'
                  ? 'Job-Specific Analysis'
                  : 'General Analysis'
              }
              sx={{
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.15)',
                fontWeight: 650,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Score overview */}
      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight={750} mb={0.5}>
          Performance Overview
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Your resume's overall performance at a glance.
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <ScoreCard
              title="Overall Resume Score"
              score={overallScore}
              description="An evaluation of your resume's overall quality, content and presentation."
              icon={<TrendingUpRounded />}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ScoreCard
              title="ATS Compatibility Score"
              score={atsScore}
              description="How well your resume is structured for Applicant Tracking Systems."
              icon={<DescriptionRounded />}
            />
          </Grid>
        </Grid>
      </Box>

      {/* ATS breakdown */}
      <Box mb={2}>
        <SectionCard>
          <SectionHeader
            icon={<TrendingUpRounded />}
            title="ATS Score Breakdown"
            subtitle="Individual factors influencing your ATS compatibility."
          />

          <Grid container spacing={2}>
            {scoringBreakdown.map((item) => (
              <Grid item xs={12} md={4} key={item.label}>
                <ScoreBreakdown
                  label={item.label}
                  value={item.value}
                />
              </Grid>
            ))}
          </Grid>

          {ats.scoringBreakdown?.issues?.length > 0 && (
            <Box mt={2}>
              <Divider sx={{ mb: 2.5 }} />

              <Typography fontWeight={750} mb={2}>
                Detected ATS Issues
              </Typography>

              <Stack spacing={1.5}>
                {ats.scoringBreakdown.issues.map(
                  (issue: any, index: number) => (
                    <Alert
                      key={index}
                      severity={
                        issue.severity === 'high'
                          ? 'error'
                          : issue.severity === 'medium'
                            ? 'warning'
                            : 'info'
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      <Typography fontWeight={700} variant="body2">
                        {issue.issue}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {issue.explanation}
                      </Typography>

                      {issue.recommendation && (
                        <Typography variant="body2" sx={{ mt: 0.8 }}>
                          <strong>Suggestion:</strong>{' '}
                          {issue.recommendation}
                        </Typography>
                      )}
                    </Alert>
                  )
                )}
              </Stack>
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* Skills */}
      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight={750} mb={0.5}>
          Skills Identified
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Skills extracted from your resume by AI.
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <SectionCard>
              <SectionHeader
                icon={<PsychologyRounded />}
                title="Technical Skills"
                subtitle={`${technicalSkills.length} skills identified`}
              />

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {technicalSkills.length ? (
                  technicalSkills.map((skill: any, index: number) => (
                    <Chip
                      key={index}
                      label={skillName(skill)}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 550 }}
                    />
                  ))
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    No technical skills identified.
                  </Typography>
                )}
              </Stack>
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard>
              <SectionHeader
                icon={<PsychologyRounded />}
                title="Soft Skills"
                subtitle={`${softSkills.length} skills identified`}
              />

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {softSkills.length ? (
                  softSkills.map((skill: any, index: number) => (
                    <Chip
                      key={index}
                      label={skillName(skill)}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 550 }}
                    />
                  ))
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    No soft skills identified.
                  </Typography>
                )}
              </Stack>
            </SectionCard>
          </Grid>
        </Grid>
      </Box>

      {/* Strengths and weaknesses */}
      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight={750} mb={0.5}>
          Resume Evaluation
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Understand what works well and what needs attention.
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                ...surfaceStyle,
                height: '100%',
                borderTop: '4px solid',
                borderTopColor: 'success.main',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader
                  icon={<CheckCircleRounded />}
                  title="Your Strengths"
                  subtitle="What your resume does well."
                />

                <TextList items={strengths} type="success" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                ...surfaceStyle,
                height: '100%',
                borderTop: '4px solid',
                borderTopColor: 'error.main',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader
                  icon={<ErrorOutlineRounded />}
                  title="Areas to Improve"
                  subtitle="Opportunities to strengthen your resume."
                />

                <TextList items={weaknesses} type="error" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* AI Recommendations */}
      <Box mb={2}>
        <SectionCard>
          <SectionHeader
            icon={<LightbulbRounded />}
            title="AI Recommendations"
            subtitle="Actionable suggestions to improve your resume."
          />

          {recommendations.length ? (
            <Stack spacing={2}>
              {recommendations.map((item: any, index: number) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2.5,
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1}
                    mb={1}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                        }}
                      >
                        <Typography fontSize={13} fontWeight={800}>
                          {index + 1}
                        </Typography>
                      </Avatar>

                      <Typography fontWeight={750}>
                        {item.recommendationTitle ||
                          item.title ||
                          `Recommendation ${index + 1}`}
                      </Typography>
                    </Stack>

                    {item.priority && (
                      <Chip
                        size="small"
                        label={`${item.priority} priority`}
                        color={
                          item.priority.toLowerCase() === 'high'
                            ? 'error'
                            : item.priority.toLowerCase() === 'medium'
                              ? 'warning'
                              : 'default'
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.8 }}
                  >
                    {item.recommendationText ||
                      item.recommendation ||
                      item.description ||
                      item.text ||
                      'No description available.'}
                  </Typography>

                  {item.example && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'primary.50',
                        border: '1px solid',
                        borderColor: 'primary.100',
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={750}
                        color="primary.main"
                      >
                        EXAMPLE
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mt: 0.5, lineHeight: 1.7 }}
                      >
                        {item.example}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary" variant="body2">
              No recommendations available.
            </Typography>
          )}
        </SectionCard>
      </Box>

      {/* Career recommendations */}
      <Box mb={2}>
        <SectionCard>
          <SectionHeader
            icon={<WorkOutlineRounded />}
            title="Career Recommendations"
            subtitle="Career paths that align with your current profile."
          />

          {careerRecommendations.length ? (
            <Grid container spacing={2}>
              {careerRecommendations.map((career: any, index: number) => (
                <Grid item xs={12} md={6} key={index}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      height: '100%',
                      borderRadius: 2.5,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={2}
                    >
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          borderRadius: 2,
                        }}
                      >
                        <WorkOutlineRounded />
                      </Avatar>

                      <Chip
                        size="small"
                        color="success"
                        label={`${Number(
                          career.matchPercentage ??
                            career.matchScore ??
                            0
                        )}% match`}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>

                    <Typography variant="h6" fontWeight={800}>
                      {career.careerTitle || career.title || 'Career Path'}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1, lineHeight: 1.7 }}
                    >
                      {career.reasoning ||
                        career.description ||
                        'No additional explanation available.'}
                    </Typography>

                    {career.requiredSkills?.length > 0 && (
                      <Box mt={2.5}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={750}
                          mb={1}
                        >
                          Required Skills
                        </Typography>

                        <Stack direction="row" flexWrap="wrap" gap={0.8}>
                          {career.requiredSkills.map(
                            (skill: any, skillIndex: number) => (
                              <Chip
                                key={skillIndex}
                                size="small"
                                label={skillName(skill)}
                                variant="outlined"
                              />
                            )
                          )}
                        </Stack>
                      </Box>
                    )}

                    {career.missingSkills?.length > 0 && (
                      <Box mt={2}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={750}
                          mb={1}
                        >
                          Skills to Develop
                        </Typography>

                        <Stack direction="row" flexWrap="wrap" gap={0.8}>
                          {career.missingSkills.map(
                            (skill: any, skillIndex: number) => (
                              <Chip
                                key={skillIndex}
                                size="small"
                                label={skillName(skill)}
                                color="warning"
                                variant="outlined"
                              />
                            )
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" variant="body2">
              No career recommendations available.
            </Typography>
          )}
        </SectionCard>
      </Box>

      {/* Skill gap analysis */}
      <Box mb={2}>
        <SectionCard>
          <SectionHeader
            icon={<SchoolRounded />}
            title="Skill Gap Analysis"
            subtitle="Skills you may need to develop for your career goals."
          />

          {skillGaps.length ? (
            <Stack spacing={2}>
              {skillGaps.map((gap: any, index: number) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={1}
                    mb={1}
                  >
                    <Typography fontWeight={750}>
                      {gap.skillName || gap.name || skillName(gap)}
                    </Typography>

                    {gap.importanceLevel && (
                      <Chip
                        size="small"
                        label={gap.importanceLevel}
                        color="warning"
                      />
                    )}
                  </Stack>

                  {gap.reason && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      {gap.reason}
                    </Typography>
                  )}

                  {gap.learningRecommendation && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                      <strong>Learning recommendation:</strong>{' '}
                      {gap.learningRecommendation}
                    </Alert>
                  )}
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                p: 3,
                borderRadius: 2.5,
                bgcolor: 'background.default',
                textAlign: 'center',
              }}
            >
              <CheckCircleRounded
                color="success"
                sx={{ fontSize: 32, mb: 1 }}
              />

              <Typography fontWeight={650}>
                No skill gaps recorded
              </Typography>

              <Typography variant="body2" color="text.secondary" mt={0.5}>
                There are no specific skill gaps recorded for this analysis.
              </Typography>
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* Bottom actions */}
      <Paper
        variant="outlined"
        sx={{
          ...surfaceStyle,
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography fontWeight={750}>
              Ready to improve your resume?
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Start another analysis to track your progress.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate('/history')}
            >
              Back to History
            </Button>

            <Button
              variant="contained"
              endIcon={<ArrowForwardRounded />}
              onClick={() => navigate('/analysis')}
            >
              New Analysis
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}