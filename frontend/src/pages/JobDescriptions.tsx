import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Pagination,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Copy,
  Delete,
  Globe,
  Lock,
  Plus,
  Search,
} from 'lucide-react';

import { apiRequest } from '../services/api';

// ============================================
// TYPES
// ============================================

type Visibility = 'public' | 'private';

type RequirementType = 'required' | 'preferred';

interface Job {
  jobId: string;
  jobTitle: string;
  company: string | null;
  description: string;
  userId: string | null;
  visibility: Visibility;
  isOwner: boolean;
  isSystemJob: boolean;
  createdAt: string;
}

interface JobsResponse {
  success: boolean;
  message: string;
  jobs: Job[];
}

interface Skill {
  skillId: string;
  skillName: string;
  category: string;
  description: string | null;
  professionalField: string;
  isActive: boolean;
}

interface SkillsResponse {
  success: boolean;
  message: string;
  skills: Skill[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SelectedSkill {
  skill: Skill;
  requirementType: RequirementType;
}

interface JobFormData {
  jobTitle: string;
  company: string;
  description: string;
  visibility: Visibility;
}

interface CreateJobResponse {
  success: boolean;
  message: string;
  job?: Job;
}

// ============================================
// INITIAL FORM DATA
// ============================================

const initialFormData: JobFormData = {
  jobTitle: '',
  company: '',
  description: '',
  visibility: 'private',
};

interface JobDetailsResponse {
  success: boolean;
  job: {
    jobId: string;
    jobTitle: string;
    company: string | null;
    description: string;
    visibility: Visibility;
    isOwner: boolean;
    isSystemJob: boolean;
    skills: {
      skillId: string;
      skillName: string;
      category: string;
      requirementType: RequirementType;
    }[];
  };
}
// ============================================
// MAIN COMPONENT
// ============================================

function JobDescriptions() {
  // Job list states.
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and filter states.
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Create dialog states.
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  // Create and Edit mode.
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  // Delete dialog states.
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] =
    useState<JobFormData>(initialFormData);

  const [selectedSkills, setSelectedSkills] = useState<
    SelectedSkill[]
  >([]);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Skill catalog states.
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillPage, setSkillPage] = useState(1);
  const [skillTotalPages, setSkillTotalPages] = useState(1);
  const [skillTotal, setSkillTotal] = useState(0);

  const SKILLS_PER_PAGE = 20;

  // ============================================
  // FETCH JOB DESCRIPTIONS
  // ============================================

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiRequest<JobsResponse>('/jobs');

      setJobs(response.jobs || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load job descriptions.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ============================================
  // FETCH SKILL CATALOG
  // ============================================

  const fetchSkills = async () => {
    try {
      setSkillsLoading(true);
      setFormError('');

      const params = new URLSearchParams({
        isActive: 'true',
        page: String(skillPage),
        limit: String(SKILLS_PER_PAGE),
      });

      if (skillSearch.trim()) {
        params.set('search', skillSearch.trim());
      }

      const response = await apiRequest<SkillsResponse>(
        `/admin/skills?${params.toString()}`,
      );

      setSkills(response.skills || []);
      setSkillTotalPages(response.pagination.totalPages);
      setSkillTotal(response.pagination.total);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Failed to load skills.',
      );
    } finally {
      setSkillsLoading(false);
    }
  };

  useEffect(() => {
    if (openCreateDialog) {
      fetchSkills();
    }
  }, [openCreateDialog, skillPage, skillSearch]);

  // ============================================
  // FILTER JOBS
  // ============================================

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (activeTab === 'mine') {
      result = result.filter((job) => job.isOwner);
    }

    if (activeTab === 'public') {
      result = result.filter(
        (job) => job.visibility === 'public',
      );
    }

    if (activeTab === 'private') {
      result = result.filter(
        (job) => job.visibility === 'private',
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      result = result.filter((job) => {
        return (
          job.jobTitle.toLowerCase().includes(query) ||
          (job.company || '').toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [jobs, activeTab, searchQuery]);

  // ============================================
  // SUMMARY COUNTS
  // ============================================

  const totalJobs = jobs.length;

  const myJobs = jobs.filter(
    (job) => job.isOwner,
  ).length;

  const publicJobs = jobs.filter(
    (job) => job.visibility === 'public',
  ).length;

  // ============================================
  // DATE FORMATTER
  // ============================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ============================================
  // OPEN CREATE DIALOG
  // ============================================

    const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setEditingJobId(null);
    setFormData(initialFormData);
    setSelectedSkills([]);
    setSkillSearch('');
    setSkillPage(1);
    setFormError('');
    setOpenCreateDialog(true);
    };
// ============================================
// OPEN EDIT DIALOG
// ============================================

const handleOpenEditDialog = async (jobId: string) => {
  try {
    setFormError('');
    setSubmitting(false);
    setSkills([]);
    setSkillSearch('');
    setSkillPage(1);

    const response = await apiRequest<JobDetailsResponse>(
      `/jobs/${jobId}`,
    );

    if (!response.job.isOwner || response.job.isSystemJob) {
      setError('You cannot edit this job description.');
      return;
    }

    setFormData({
      jobTitle: response.job.jobTitle,
      company: response.job.company || '',
      description: response.job.description,
      visibility: response.job.visibility,
    });

    setSelectedSkills(
      response.job.skills.map((item) => ({
        skill: {
          skillId: item.skillId,
          skillName: item.skillName,
          category: item.category,
          description: null,
          professionalField: '',
          isActive: true,
        },
        requirementType: item.requirementType,
      })),
    );

    setIsEditMode(true);
    setEditingJobId(jobId);
    setOpenCreateDialog(true);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Failed to load job details.',
    );
  }
};
  // ============================================
  // CLOSE CREATE DIALOG
  // ============================================

  const handleCloseCreateDialog = () => {
    if (submitting) {
      return;
    }

    setOpenCreateDialog(false);
    setFormError('');
  };

  // ============================================
  // UPDATE FORM DATA
  // ============================================

  const handleFormChange = (
    field: keyof JobFormData,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ============================================
  // UPDATE SELECTED SKILLS
  // ============================================

  const handleSkillSelection = (newSkills: Skill[]) => {
    setSelectedSkills((previous) => {
      return newSkills.map((skill) => {
        const existing = previous.find(
          (item) => item.skill.skillId === skill.skillId,
        );

        return (
          existing || {
            skill,
            requirementType: 'required' as RequirementType,
          }
        );
      });
    });
  };

  // ============================================
  // CHANGE SKILL REQUIREMENT TYPE
  // ============================================

  const handleRequirementChange = (
    skillId: string,
    requirementType: RequirementType,
  ) => {
    setSelectedSkills((previous) =>
      previous.map((item) =>
        item.skill.skillId === skillId
          ? { ...item, requirementType }
          : item,
      ),
    );
  };

  // ============================================
  // VALIDATE FORM
  // ============================================

  const validateForm = (): boolean => {
    if (formData.jobTitle.trim().length < 2) {
      setFormError(
        'Job title must contain at least 2 characters.',
      );
      return false;
    }

    if (formData.jobTitle.trim().length > 200) {
      setFormError(
        'Job title cannot exceed 200 characters.',
      );
      return false;
    }

    if (formData.company.trim().length > 200) {
      setFormError(
        'Company name cannot exceed 200 characters.',
      );
      return false;
    }

    if (formData.description.trim().length < 20) {
      setFormError(
        'Job description must contain at least 20 characters.',
      );
      return false;
    }

    if (selectedSkills.length === 0) {
      setFormError(
        'Please select at least one skill.',
      );
      return false;
    }

    return true;
  };

  // ============================================
  // CREATE JOB DESCRIPTION
  // ============================================

const handleCreateJob = async () => {
  setFormError('');

  if (!validateForm()) {
    return;
  }

  if (isEditMode && !editingJobId) {
    setFormError('Invalid job selected for editing.');
    return;
  }

  try {
    setSubmitting(true);

    const payload = {
      jobTitle: formData.jobTitle.trim(),
      company: formData.company.trim() || null,
      description: formData.description.trim(),
      visibility: formData.visibility,
      skills: selectedSkills.map((item) => ({
        skillId: item.skill.skillId,
        requirementType: item.requirementType,
      })),
    };

    const response = await apiRequest<CreateJobResponse>(
      isEditMode ? `/jobs/${editingJobId}` : '/jobs',
      {
        method: isEditMode ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      },
    );

    setOpenCreateDialog(false);
    setFormData(initialFormData);
    setSelectedSkills([]);
    setIsEditMode(false);
    setEditingJobId(null);

    await fetchJobs();

    setError('');
    alert(
      response.message ||
        (isEditMode
          ? 'Job description updated successfully.'
          : 'Job description created successfully.'),
    );
  } catch (err) {
    setFormError(
      err instanceof Error
        ? err.message
        : isEditMode
          ? 'Failed to update job description.'
          : 'Failed to create job description.',
    );
  } finally {
    setSubmitting(false);
  }
};
// ============================================
// DELETE JOB DESCRIPTION
// ============================================

const handleDeleteJob = async () => {
  if (!jobToDelete) {
    return;
  }

  try {
    setDeleting(true);

    const response = await apiRequest<{
      success: boolean;
      message: string;
    }>(`/jobs/${jobToDelete.jobId}`, {
      method: 'DELETE',
    });

    setJobToDelete(null);

    await fetchJobs();

    alert(response.message || 'Job description deleted successfully.');
  } catch (err) {
    setJobToDelete(null);

    setError(
      err instanceof Error
        ? err.message
        : 'Failed to delete job description.',
    );
  } finally {
    setDeleting(false);
  }
};

// ============================================
// DUPLICATE PUBLIC JOB DESCRIPTION
// ============================================

const handleDuplicateJob = async (jobId: string) => {
  try {
    const response = await apiRequest<{
      success: boolean;
      message: string;
      job?: Job;
    }>(`/jobs/${jobId}/duplicate`, {
      method: 'POST',
    });

    await fetchJobs();

    alert(response.message || 'Job description duplicated successfully.');
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Failed to duplicate job description.',
    );
  }
};
  // ============================================
  // SUMMARY CARD
  // ============================================

  const SummaryCard = ({
    title,
    value,
    icon,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
  }) => (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ mt: 1 }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ============================================
  // MAIN UI
  // ============================================

  return (
    <Box>
      {/* PAGE HEADER */}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Job Descriptions
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Create, manage, and explore job descriptions
            for resume analysis.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleOpenCreateDialog}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
          }}
        >
          Create Job
        </Button>
      </Stack>

      {/* ERROR MESSAGE */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchJobs}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* SUMMARY CARDS */}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
          },
          gap: 2,
          mb: 4,
        }}
      >
        <SummaryCard
          title="Accessible Jobs"
          value={totalJobs}
          icon={<BriefcaseBusiness size={22} />}
        />

        <SummaryCard
          title="My Jobs"
          value={myJobs}
          icon={<Building2 size={22} />}
        />

        <SummaryCard
          title="Public Jobs"
          value={publicJobs}
          icon={<Globe size={22} />}
        />
      </Box>

      {/* SEARCH */}

      <TextField
        fullWidth
        placeholder="Search by job title, company, or description..."
        value={searchQuery}
        onChange={(event) =>
          setSearchQuery(event.target.value)
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={19} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      {/* FILTER TABS */}

      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Jobs" value="all" />
          <Tab label="My Jobs" value="mine" />
          <Tab label="Public" value="public" />
          <Tab label="Private" value="private" />
        </Tabs>
      </Box>

      {/* JOB LIST */}

      {filteredJobs.length === 0 ? (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            textAlign: 'center',
            py: 6,
            px: 2,
          }}
        >
          <BriefcaseBusiness size={42} color="gray" />

          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mt: 2 }}
          >
            No job descriptions found
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Try changing your search or selecting another category.
          </Typography>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            },
            gap: 2,
          }}
        >
          {filteredJobs.map((job) => (
            <Card
              key={job.jobId}
              variant="outlined"
              sx={{
                borderRadius: 3,
                height: '100%',
                transition: '0.2s',
                '&:hover': {
                  boxShadow: 3,
                  borderColor: 'primary.main',
                },
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  '&:last-child': {
                    pb: 3,
                  },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={2}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                    >
                      {job.jobTitle}
                    </Typography>

                    {job.company && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mt: 1 }}
                      >
                        <Building2 size={16} color="gray" />

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {job.company}
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  <Chip
                    size="small"
                    icon={
                      job.visibility === 'public'
                        ? <Globe size={14} />
                        : <Lock size={14} />
                    }
                    label={job.visibility}
                    color={
                      job.visibility === 'public'
                        ? 'success'
                        : 'default'
                    }
                    variant="outlined"
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 2,
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: 60,
                    lineHeight: 1.6,
                  }}
                >
                  {job.description}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mb: 2 }}
                >
                  {job.isSystemJob && (
                    <Chip
                      label="System Job"
                      size="small"
                      color="info"
                    />
                  )}

                  {!job.isSystemJob && job.isOwner && (
                    <Chip
                      label="My Job"
                      size="small"
                      color="primary"
                    />
                  )}

                  {!job.isSystemJob && !job.isOwner && (
                    <Chip
                      label="Community Job"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <CalendarDays size={15} color="gray" />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Created {formatDate(job.createdAt)}
                  </Typography>
                </Stack>

                <Stack
                direction="row"
                spacing={1}
                sx={{
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                }}
                >
                {job.isOwner && !job.isSystemJob && (
                    <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenEditDialog(job.jobId)}
                    sx={{ textTransform: 'none' }}
                    >
                    Edit
                    </Button>
                )}
                {job.isOwner && !job.isSystemJob && (
                <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete size={15} />}
                    onClick={() => setJobToDelete(job)}
                    sx={{ textTransform: 'none' }}
                >
                    Delete
                </Button>
                )}
                <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Copy size={15} />}
                onClick={() => handleDuplicateJob(job.jobId)}
                sx={{ textTransform: 'none' }}
                >
                Duplicate
                </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
{
/* ========================================
    DELETE CONFIRMATION DIALOG
======================================== */}

<Dialog
  open={Boolean(jobToDelete)}
  onClose={() => {
    if (!deleting) {
      setJobToDelete(null);
    }
  }}
  maxWidth="xs"
  fullWidth
>
  <DialogTitle fontWeight={700}>
    Delete Job Description?
  </DialogTitle>

  <DialogContent>
    <Typography color="text.secondary">
      Are you sure you want to delete{' '}
      <strong>{jobToDelete?.jobTitle}</strong>?
      This action cannot be undone.
    </Typography>
  </DialogContent>

  <DialogActions sx={{ p: 3 }}>
    <Button
      color="inherit"
      onClick={() => setJobToDelete(null)}
      disabled={deleting}
      sx={{ textTransform: 'none' }}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      color="error"
      onClick={handleDeleteJob}
      disabled={deleting}
      startIcon={
        deleting ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <Delete size={16} />
        )
      }
      sx={{ textTransform: 'none' }}
    >
      {deleting ? 'Deleting...' : 'Delete Job'}
    </Button>
  </DialogActions>
</Dialog>
      {/* ========================================
          CREATE JOB DIALOG
      ======================================== */}

      <Dialog
        open={openCreateDialog}
        onClose={handleCloseCreateDialog}
        fullWidth
        maxWidth="md"
        fullScreen={false}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3 },
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
           {isEditMode ? 'Edit Job Description' : 'Create Job Description'}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Add job information and select the skills
            required for this position.
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* FORM ERROR */}

            {formError && (
              <Alert severity="error">
                {formError}
              </Alert>
            )}

            {/* JOB TITLE */}

            <TextField
              label="Job Title"
              placeholder="e.g. Frontend Developer"
              fullWidth
              required
              value={formData.jobTitle}
              onChange={(event) =>
                handleFormChange(
                  'jobTitle',
                  event.target.value,
                )
              }
              inputProps={{ maxLength: 200 }}
            />

            {/* COMPANY */}

            <TextField
              label="Company Name"
              placeholder="e.g. Google"
              fullWidth
              value={formData.company}
              onChange={(event) =>
                handleFormChange(
                  'company',
                  event.target.value,
                )
              }
              inputProps={{ maxLength: 200 }}
            />

            {/* DESCRIPTION */}

            <TextField
              label="Job Description"
              placeholder="Describe the responsibilities, qualifications, and expectations..."
              fullWidth
              required
              multiline
              minRows={6}
              value={formData.description}
              onChange={(event) =>
                handleFormChange(
                  'description',
                  event.target.value,
                )
              }
            />

            {/* VISIBILITY */}

            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 1 }}
              >
                Job Visibility
              </Typography>

              <RadioGroup
                value={formData.visibility}
                onChange={(event) =>
                  handleFormChange(
                    'visibility',
                    event.target.value,
                  )
                }
              >
                <FormControlLabel
                  value="private"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography fontWeight={600}>
                        Private
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Only you can view and manage this job.
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  value="public"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography fontWeight={600}>
                        Public
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Other authenticated users can view this job.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>

            {/* SKILL SELECTION */}

            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 1 }}
              >
                Required and Preferred Skills *
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Select at least one skill from the catalog.
                You can search and browse different pages.
              </Typography>

              <Autocomplete
                multiple
                options={skills}
                value={selectedSkills.map(
                  (item) => item.skill,
                )}
                loading={skillsLoading}
                getOptionLabel={(option) => option.skillName}
                isOptionEqualToValue={(option, value) =>
                  option.skillId === value.skillId
                }
                onChange={(_, newValue) =>
                  handleSkillSelection(newValue)
                }
                filterOptions={(options) => options}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search and select skills"
                    placeholder="Search skills..."
                    onChange={(event) => {
                      setSkillSearch(event.target.value);
                      setSkillPage(1);
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {skillsLoading && (
                            <CircularProgress
                              size={18}
                              sx={{ mr: 1 }}
                            />
                          )}

                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.skillId}>
                    <Box>
                      <Typography fontWeight={600}>
                        {option.skillName}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {option.category} · {option.professionalField}
                      </Typography>
                    </Box>
                  </li>
                )}
              />

              {/* SKILL PAGINATION */}

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                sx={{ mt: 2 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {skillTotal} active skills · Page {skillPage} of{' '}
                  {skillTotalPages}
                </Typography>

                <Pagination
                  count={Math.max(skillTotalPages, 1)}
                  page={skillPage}
                  onChange={(_, page) => setSkillPage(page)}
                  color="primary"
                  size="small"
                />
              </Stack>

              {/* SELECTED SKILLS */}

              {selectedSkills.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Selected Skills ({selectedSkills.length})
                  </Typography>

                  <Stack spacing={2}>
                    {selectedSkills.map((item) => (
                      <Card
                        key={item.skill.skillId}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack
                            direction={{
                              xs: 'column',
                              sm: 'row',
                            }}
                            justifyContent="space-between"
                            alignItems={{
                              xs: 'flex-start',
                              sm: 'center',
                            }}
                            spacing={2}
                          >
                            <Box>
                              <Typography fontWeight={600}>
                                {item.skill.skillName}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.skill.category}
                              </Typography>
                            </Box>

                            <FormControl
                              size="small"
                              sx={{
                                minWidth: 150,
                                width: {
                                  xs: '100%',
                                  sm: 'auto',
                                },
                              }}
                            >
                              <Select
                                value={item.requirementType}
                                onChange={(event) =>
                                  handleRequirementChange(
                                    item.skill.skillId,
                                    event.target.value as RequirementType,
                                  )
                                }
                              >
                                <MenuItem value="required">
                                  Required
                                </MenuItem>

                                <MenuItem value="preferred">
                                  Preferred
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseCreateDialog}
            color="inherit"
            disabled={submitting}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateJob}
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Plus size={17} />
              )
            }
            sx={{ textTransform: 'none', px: 3 }}
          >
            {submitting
                ? isEditMode
                    ? 'Saving...'
                    : 'Creating...'
                : isEditMode
                    ? 'Save Changes'
                    : 'Create Job'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default JobDescriptions;