import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import {
  ArrowRight,
  FileText,
  BriefcaseBusiness,
  Sparkles,
  Upload,
} from 'lucide-react';

import { apiRequest } from '../services/api';

// ==========================================
// TYPES
// ==========================================

type AnalysisType = 'general' | 'job_specific';

interface Resume {
  resumeId: string;
  resumeTitle: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadDate: string;
}

interface ResumesResponse {
  success: boolean;
  count: number;
  resumes: Resume[];
}

interface Job {
  jobId: string;
  jobTitle: string;
  company: string | null;
  createdAt: string;
}

interface JobsResponse {
  success: boolean;
  message: string;
  jobs: Job[];
}

interface AnalysisResult {
  analysisId: string;
  resumeId: string;
  analysisType: AnalysisType;
  jobId: string | null;
  matchScore: number;
  createdAt: string;
}

interface CreateAnalysisResponse {
  success: boolean;
  message: string;
  data: AnalysisResult;
}

// ==========================================
// COMPONENT
// ==========================================

function NewAnalysis() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [selectedResume, setSelectedResume] = useState('');
  const [selectedJob, setSelectedJob] = useState('');

  const [analysisType, setAnalysisType] =
    useState<AnalysisType>('general');

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [resumeError, setResumeError] = useState('');
  const [jobError, setJobError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // ==========================================
  // FETCH USER RESUMES
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    async function fetchResumes() {
      try {
        setLoadingResumes(true);
        setResumeError('');

        const response = await apiRequest<ResumesResponse>(
          '/resumes'
        );

        if (isMounted) {
          setResumes(response.resumes ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setResumeError(
            error instanceof Error
              ? error.message
              : 'Unable to load your resumes.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingResumes(false);
        }
      }
    }

    fetchResumes();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // FETCH JOBS WHEN JOB-SPECIFIC IS SELECTED
  // ==========================================

  useEffect(() => {
    if (analysisType !== 'job_specific') {
      setSelectedJob('');
      setJobError('');
      return;
    }

    let isMounted = true;

    async function fetchJobs() {
      try {
        setLoadingJobs(true);
        setJobError('');

        const response = await apiRequest<JobsResponse>(
          '/jobs'
        );

        if (isMounted) {
          setJobs(response.jobs ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setJobError(
            error instanceof Error
              ? error.message
              : 'Unable to load available jobs.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingJobs(false);
        }
      }
    }

    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, [analysisType]);

  // ==========================================
  // START ANALYSIS
  // ==========================================

  async function handleStartAnalysis() {
    setSubmitError('');

    if (!selectedResume) {
      setSubmitError('Please select a resume before continuing.');
      return;
    }

    if (
      analysisType === 'job_specific' &&
      !selectedJob
    ) {
      setSubmitError('Please select a job description.');
      return;
    }

    try {
      setSubmitting(true);

      const response =
        analysisType === 'general'
          ? await apiRequest<CreateAnalysisResponse>(
              '/analysis/general',
              {
                method: 'POST',
                body: JSON.stringify({
                  resumeId: selectedResume,
                }),
              }
            )
          : await apiRequest<CreateAnalysisResponse>(
              '/analysis/job-specific',
              {
                method: 'POST',
                body: JSON.stringify({
                  resumeId: selectedResume,
                  jobId: selectedJob,
                }),
              }
            );

      navigate(`/analysis/${response.data.analysisId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to start the analysis. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Page Heading */}

      <Box sx={{ mb: 4 }}>

        <Typography color="text.secondary">
          Select your resume and choose how you want ResumeIQ
          to evaluate it.
        </Typography>
      </Box>

      {/* Main Form */}

      <Stack spacing={3}>
        {/* STEP 1: SELECT RESUME */}

        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={21} />
              </Box>

              <Box>
                <Typography fontWeight={700}>
                  Step 1: Select Your Resume
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Choose an uploaded resume to analyze.
                </Typography>
              </Box>
            </Stack>

            {loadingResumes ? (
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ py: 2 }}
              >
                <CircularProgress size={22} />
                <Typography color="text.secondary">
                  Loading your resumes...
                </Typography>
              </Stack>
            ) : resumeError ? (
              <Alert severity="error">
                {resumeError}
              </Alert>
            ) : resumes.length === 0 ? (
              <Alert
                severity="info"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<Upload size={16} />}
                    onClick={() => navigate('/upload-resume')}
                  >
                    Upload Resume
                  </Button>
                }
              >
                You haven't uploaded any resumes yet.
                Upload a resume before starting an analysis.
              </Alert>
            ) : (
              <FormControl fullWidth>
                <Select
                  value={selectedResume}
                  onChange={(event) =>
                    setSelectedResume(event.target.value)
                  }
                  displayEmpty
                  disabled={submitting}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="" disabled>
                    Select a resume
                  </MenuItem>

                  {resumes.map((resume) => (
                    <MenuItem
                      key={resume.resumeId}
                      value={resume.resumeId}
                    >
                      <Box>
                        <Typography fontWeight={600}>
                          {resume.resumeTitle}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {resume.originalFileName} ·{' '}
                          {formatFileSize(resume.fileSizeBytes)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </CardContent>
        </Card>

        {/* STEP 2: ANALYSIS TYPE */}

        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: 'secondary.light',
                  color: 'secondary.dark',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={21} />
              </Box>

              <Box>
                <Typography fontWeight={700}>
                  Step 2: Choose Analysis Type
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Decide how you want your resume evaluated.
                </Typography>
              </Box>
            </Stack>

            <RadioGroup
              value={analysisType}
              onChange={(event) => {
                setAnalysisType(
                  event.target.value as AnalysisType
                );
                setSubmitError('');
              }}
            >
              <Stack spacing={2}>
                {/* GENERAL ANALYSIS */}

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor:
                      analysisType === 'general'
                        ? 'primary.main'
                        : 'divider',
                    bgcolor:
                      analysisType === 'general'
                        ? 'action.selected'
                        : 'transparent',
                  }}
                >
                  <FormControlLabel
                    value="general"
                    disabled={submitting}
                    control={<Radio />}
                    sx={{
                      m: 0,
                      p: 2,
                      width: '100%',
                      alignItems: 'flex-start',
                    }}
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Typography fontWeight={700}>
                          General Resume Analysis
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Evaluate your resume's overall quality,
                          structure, skills, strengths, and areas
                          for improvement.
                        </Typography>
                      </Box>
                    }
                  />
                </Card>

                {/* JOB-SPECIFIC ANALYSIS */}

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor:
                      analysisType === 'job_specific'
                        ? 'primary.main'
                        : 'divider',
                    bgcolor:
                      analysisType === 'job_specific'
                        ? 'action.selected'
                        : 'transparent',
                  }}
                >
                  <FormControlLabel
                    value="job_specific"
                    disabled={submitting}
                    control={<Radio />}
                    sx={{
                      m: 0,
                      p: 2,
                      width: '100%',
                      alignItems: 'flex-start',
                    }}
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Typography fontWeight={700}>
                          Job-Specific Analysis
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Compare your resume against a selected
                          job description and evaluate how well
                          your skills match its requirements.
                        </Typography>
                      </Box>
                    }
                  />
                </Card>
              </Stack>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* STEP 3: SELECT JOB */}

        {analysisType === 'job_specific' && (
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2.5 }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    color: 'success.dark',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BriefcaseBusiness size={21} />
                </Box>

                <Box>
                  <Typography fontWeight={700}>
                    Step 3: Select a Job
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Choose the job you want to target.
                  </Typography>
                </Box>
              </Stack>

              {loadingJobs ? (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ py: 2 }}
                >
                  <CircularProgress size={22} />

                  <Typography color="text.secondary">
                    Loading available jobs...
                  </Typography>
                </Stack>
              ) : jobError ? (
                <Alert severity="error">
                  {jobError}
                </Alert>
              ) : jobs.length === 0 ? (
                <Alert severity="info">
                  No jobs with active skill requirements are
                  currently available.
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <Select
                    value={selectedJob}
                    onChange={(event) =>
                      setSelectedJob(event.target.value)
                    }
                    displayEmpty
                    disabled={submitting}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="" disabled>
                      Select a job description
                    </MenuItem>

                    {jobs.map((job) => (
                      <MenuItem
                        key={job.jobId}
                        value={job.jobId}
                      >
                        {job.jobTitle}
                        {job.company
                          ? ` — ${job.company}`
                          : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </CardContent>
          </Card>
        )}

        {/* SUBMIT SECTION */}

        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            {submitError && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
              >
                {submitError}
              </Alert>
            )}

            <Divider sx={{ mb: 2.5 }} />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
            >
              <Box>
                <Typography fontWeight={700}>
                  Ready to analyze?
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Your analysis may take a few moments.
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                endIcon={
                  submitting ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <ArrowRight size={18} />
                  )
                }
                onClick={handleStartAnalysis}
                disabled={
                  submitting ||
                  loadingResumes ||
                  resumes.length === 0 ||
                  (analysisType === 'job_specific' &&
                    (loadingJobs || jobs.length === 0))
                }
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.3,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                {submitting
                  ? 'Analyzing Resume...'
                  : 'Start Analysis'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default NewAnalysis;