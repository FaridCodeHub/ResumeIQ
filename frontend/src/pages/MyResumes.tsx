import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  TextField,
  Snackbar,
} from '@mui/material';

import Grid from '@mui/material/Grid2';

import {
  DescriptionOutlined,
  PictureAsPdfOutlined,
  ArticleOutlined,
  VisibilityOutlined,
  CloseOutlined,
  OpenInNewOutlined,
  DownloadOutlined,
  InsertDriveFileOutlined,
  EditOutlined,
  SaveOutlined,
  DeleteOutline,
  CalendarMonthOutlined,
  StorageOutlined,
  FolderOpenOutlined,
  CloudUploadOutlined,
} from '@mui/icons-material';

import {
  apiRequest,
  apiBlobRequest,
} from '../services/api';

// ==========================================
// TYPES
// ==========================================

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
  message: string;
  resumes: Resume[];
}

interface ResumeDetailsResponse {
  success: boolean;
  resume: Resume & {
    extractedText: string;
  };
}

interface RenameResumeResponse {
  success: boolean;
  message: string;
  resume: {
    resumeId: string;
    resumeTitle: string;
    originalFileName: string;
    uploadDate: string;
  };
}

interface DeleteResumeResponse {
  success: boolean;
  message: string;
}

// ==========================================
// COMPONENT
// ==========================================

function MyResumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notification
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Extracted text
  const [selectedResume, setSelectedResume] = useState<
    (Resume & { extractedText: string }) | null
  >(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  // PDF preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);

  // Rename
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameResume, setRenameResume] = useState<Resume | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState('');

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteResume, setDeleteResume] = useState<Resume | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==========================================
  // NOTIFICATION HELPER
  // ==========================================

  const showNotification = (
    message: string,
    severity: 'success' | 'error' = 'success'
  ) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  // ==========================================
  // FETCH USER RESUMES
  // ==========================================

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await apiRequest<ResumeListResponse>('/resumes');

        setResumes(response.resumes ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load your resumes.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ==========================================
  // FORMAT HELPERS
  // ==========================================

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ==========================================
  // VIEW EXTRACTED TEXT
  // ==========================================

  const handleViewExtractedText = async (resumeId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError('');
      setSelectedResume(null);
      setDetailsOpen(true);

      const response = await apiRequest<ResumeDetailsResponse>(
        `/resumes/${resumeId}`
      );

      setSelectedResume(response.resume);
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve extracted text.'
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ==========================================
  // PDF PREVIEW
  // ==========================================

  const handlePreviewResume = async (resume: Resume) => {
    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewError('');
      setPreviewResume(resume);

      setPreviewUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        return null;
      });

      const blob = await apiBlobRequest(
        `/resumes/${resume.resumeId}/preview`
      );

      if (blob.type !== 'application/pdf') {
        throw new Error('The server did not return a valid PDF file.');
      }

      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setPreviewError(
        err instanceof Error
          ? err.message
          : 'Unable to preview this resume.'
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setPreviewResume(null);
    setPreviewError('');
  };

  // ==========================================
  // DOWNLOAD ORIGINAL RESUME
  // ==========================================

  const handleDownloadResume = async (resume: Resume) => {
    try {
      const blob = await apiBlobRequest(
        `/resumes/${resume.resumeId}/download`
      );

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = resume.originalFileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (err) {
      showNotification(
        err instanceof Error
          ? err.message
          : 'Unable to download this resume.',
        'error'
      );
    }
  };

  // ==========================================
  // RENAME RESUME
  // ==========================================

  const handleOpenRename = (resume: Resume) => {
    setRenameResume(resume);
    setRenameTitle(resume.resumeTitle);
    setRenameError('');
    setRenameOpen(true);
  };

  const handleCloseRename = () => {
    if (renameLoading) return;

    setRenameOpen(false);
    setRenameResume(null);
    setRenameTitle('');
    setRenameError('');
  };

  const handleRenameResume = async () => {
    if (!renameResume) return;

    const trimmedTitle = renameTitle.trim();

    if (!trimmedTitle) {
      setRenameError('Resume title cannot be empty.');
      return;
    }

    if (trimmedTitle.length > 200) {
      setRenameError('Resume title cannot exceed 200 characters.');
      return;
    }

    try {
      setRenameLoading(true);
      setRenameError('');

      const response = await apiRequest<RenameResumeResponse>(
        `/resumes/${renameResume.resumeId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            resumeTitle: trimmedTitle,
          }),
        }
      );

      setResumes((previousResumes) =>
        previousResumes.map((resume) =>
          resume.resumeId === response.resume.resumeId
            ? {
                ...resume,
                resumeTitle: response.resume.resumeTitle,
              }
            : resume
        )
      );

      setRenameOpen(false);
      setRenameResume(null);
      setRenameTitle('');

      showNotification('Resume renamed successfully.');
    } catch (err) {
      setRenameError(
        err instanceof Error
          ? err.message
          : 'Unable to rename this resume.'
      );
    } finally {
      setRenameLoading(false);
    }
  };

  // ==========================================
  // DELETE RESUME
  // ==========================================

  const handleOpenDelete = (resume: Resume) => {
    setDeleteResume(resume);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    if (deleteLoading) return;

    setDeleteOpen(false);
    setDeleteResume(null);
  };

  const handleDeleteResume = async () => {
    if (!deleteResume) return;

    try {
      setDeleteLoading(true);

      const response = await apiRequest<DeleteResumeResponse>(
        `/resumes/${deleteResume.resumeId}`,
        {
          method: 'DELETE',
        }
      );

      setResumes((previousResumes) =>
        previousResumes.filter(
          (resume) => resume.resumeId !== deleteResume.resumeId
        )
      );

      setDeleteOpen(false);
      setDeleteResume(null);

      showNotification(
        response.message || 'Resume deleted successfully.'
      );
    } catch (err) {
      showNotification(
        err instanceof Error
          ? err.message
          : 'Unable to delete this resume.',
        'error'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ py: 10 }}
        spacing={2}
      >
        <CircularProgress />

        <Typography color="text.secondary">
          Loading your resumes...
        </Typography>
      </Stack>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <Box sx={{ pb: 4 }}>

      {/* PAGE HEADER */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ letterSpacing: '-0.5px' }}
          >
            My Resumes
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.7 }}
          >
            Manage and organize your professional documents.
          </Typography>
        </Box>

        <Chip
          icon={<DescriptionOutlined />}
          label={`${resumes.length} ${resumes.length === 1 ? 'Resume' : 'Resumes'}`}
          color="primary"
          variant="outlined"
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            px: 1,
            py: 2.2,
          }}
        />
      </Box>

      {/* ERROR MESSAGE */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* EMPTY STATE */}
      {!error && resumes.length === 0 && (
        <Card
          sx={{
            borderRadius: 4,
            border: '1px dashed',
            borderColor: 'divider',
            boxShadow: 'none',
            background: (theme) =>
              theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #ffffff 0%, #f5f8ff 100%)'
                : 'linear-gradient(135deg, #1e1e2d 0%, #171725 100%)',
          }}
        >
          <CardContent sx={{ py: 9, textAlign: 'center' }}>
            <Box
              sx={{
                width: 76,
                height: 76,
                mx: 'auto',
                mb: 2.5,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: '#fff',
                boxShadow: 3,
              }}
            >
              <FolderOpenOutlined sx={{ fontSize: 38 }} />
            </Box>

            <Typography variant="h6" fontWeight={800}>
              Your resume library is empty
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1, maxWidth: 420, mx: 'auto' }}
            >
              Upload your first resume and start building your professional
              profile with ResumeIQ.
            </Typography>

            <Button
              variant="contained"
              startIcon={<CloudUploadOutlined />}
              href="/upload-resume"
              sx={{
                mt: 3,
                borderRadius: 2,
                px: 3,
                py: 1.2,
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              Upload Resume
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ======================================
          RESUME CARDS
      ====================================== */}

      <Grid container spacing={2.5}>
        {resumes.map((resume) => {
          const isPDF = resume.mimeType === 'application/pdf';

          return (
            <Grid
              key={resume.resumeId}
              size={{ xs: 12, sm: 6, lg: 4 }}
            >
              <Card
                sx={{
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.035)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.09)',
                    borderColor: 'primary.light',
                  },
                }}
              >
                {/* CARD TOP SECTION */}
                <Box
                  sx={{
                    px: 2.5,
                    py: 2.2,
                    background: (theme) =>
                      theme.palette.mode === 'light'
                        ? isPDF
                          ? 'linear-gradient(135deg, #fff5f5 0%, #fce8e8 100%)'
                          : 'linear-gradient(135deg, #f1f6ff 0%, #e5efff 100%)'
                        : isPDF
                          ? 'linear-gradient(135deg, #38252a 0%, #29202a 100%)'
                          : 'linear-gradient(135deg, #202d46 0%, #202438 100%)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.paper',
                        color: isPDF ? 'error.main' : 'primary.main',
                        boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
                      }}
                    >
                      {isPDF ? (
                        <PictureAsPdfOutlined sx={{ fontSize: 30 }} />
                      ) : (
                        <ArticleOutlined sx={{ fontSize: 30 }} />
                      )}
                    </Box>

                    <Chip
                      size="small"
                      label={isPDF ? 'PDF' : 'DOCX'}
                      sx={{
                        fontWeight: 800,
                        letterSpacing: 0.5,
                        bgcolor: 'background.paper',
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="h6"
                    fontWeight={800}
                    noWrap
                    title={resume.resumeTitle}
                    sx={{
                      mt: 2,
                      fontSize: '1.05rem',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {resume.resumeTitle}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    title={resume.originalFileName}
                    sx={{ mt: 0.5 }}
                  >
                    {resume.originalFileName}
                  </Typography>
                </Box>

                <CardContent sx={{ p: 2.5 }}>

                  {/* FILE DETAILS */}
                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      <Box
                        sx={{
                          p: 1.4,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          height: '100%',
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.8}
                        >
                          <StorageOutlined
                            sx={{
                              fontSize: 17,
                              color: 'text.secondary',
                            }}
                          />

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            File Size
                          </Typography>
                        </Stack>

                        <Typography
                          fontWeight={700}
                          variant="body2"
                          sx={{ mt: 0.7 }}
                        >
                          {formatFileSize(resume.fileSizeBytes)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={6}>
                      <Box
                        sx={{
                          p: 1.4,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          height: '100%',
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.8}
                        >
                          <CalendarMonthOutlined
                            sx={{
                              fontSize: 17,
                              color: 'text.secondary',
                            }}
                          />

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Uploaded
                          </Typography>
                        </Stack>

                        <Typography
                          fontWeight={700}
                          variant="body2"
                          sx={{ mt: 0.7 }}
                        >
                          {formatDate(resume.uploadDate)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* PRIMARY ACTION */}
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<VisibilityOutlined />}
                    onClick={() =>
                      handleViewExtractedText(resume.resumeId)
                    }
                    sx={{
                      borderRadius: 2,
                      py: 1.1,
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: 'none',
                    }}
                  >
                    View Extracted Text
                  </Button>

                  {/* SECONDARY ACTIONS */}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1.3 }}
                  >
                    <Button
                      fullWidth
                      variant="outlined"
                      size="medium"
                      startIcon={<DownloadOutlined />}
                      onClick={() => handleDownloadResume(resume)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Download
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      size="medium"
                      startIcon={<EditOutlined />}
                      onClick={() => handleOpenRename(resume)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Rename
                    </Button>
                  </Stack>

                  {/* PREVIEW AND DELETE */}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1.3 }}
                  >
                    {isPDF && (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        startIcon={<OpenInNewOutlined />}
                        onClick={() => handlePreviewResume(resume)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Preview
                      </Button>
                    )}

                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutline />}
                      onClick={() => handleOpenDelete(resume)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ======================================
          EXTRACTED TEXT DIALOG
      ====================================== */}

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Extracted Resume Text
              </Typography>

              {selectedResume && (
                <Typography variant="caption" color="text.secondary">
                  {selectedResume.originalFileName}
                </Typography>
              )}
            </Box>

            <IconButton
              onClick={() => setDetailsOpen(false)}
              aria-label="Close extracted text"
            >
              <CloseOutlined />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ minHeight: 300 }}>
          {detailsLoading && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ py: 8 }}
              spacing={2}
            >
              <CircularProgress />

              <Typography color="text.secondary">
                Loading extracted text...
              </Typography>
            </Stack>
          )}

          {detailsError && (
            <Alert severity="error">{detailsError}</Alert>
          )}

          {!detailsLoading && selectedResume && (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                bgcolor: 'action.hover',
              }}
            >
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                {selectedResume.extractedText ||
                  'No extracted text is available for this resume.'}
              </Typography>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDetailsOpen(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================
          RENAME DIALOG
      ====================================== */}

      <Dialog
        open={renameOpen}
        onClose={handleCloseRename}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" fontWeight={700}>
              Rename Resume
            </Typography>

            <IconButton
              onClick={handleCloseRename}
              disabled={renameLoading}
              aria-label="Close rename dialog"
            >
              <CloseOutlined />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Change the display name of your resume. Your original uploaded
            filename will remain unchanged.
          </Typography>

          <TextField
            fullWidth
            label="Resume Title"
            value={renameTitle}
            onChange={(event) => {
              setRenameTitle(event.target.value);
              setRenameError('');
            }}
            inputProps={{ maxLength: 200 }}
            helperText={`${renameTitle.length}/200 characters`}
            error={Boolean(renameError)}
            disabled={renameLoading}
            autoFocus
          />

          {renameError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {renameError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseRename}
            color="inherit"
            disabled={renameLoading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={
              renameLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveOutlined />
              )
            }
            onClick={handleRenameResume}
            disabled={renameLoading || !renameTitle.trim()}
          >
            {renameLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================
          DELETE CONFIRMATION DIALOG
      ====================================== */}

      <Dialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" fontWeight={800}>
              Delete Resume?
            </Typography>

            <IconButton
              onClick={handleCloseDelete}
              disabled={deleteLoading}
              aria-label="Close delete dialog"
            >
              <CloseOutlined />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2.5,
              bgcolor: 'error.light',
              color: 'error.dark',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <DeleteOutline sx={{ fontSize: 30 }} />
          </Box>

          <Typography fontWeight={700}>
            Are you sure you want to delete this resume?
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            You are about to delete:
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mt: 1.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Typography fontWeight={700} noWrap>
              {deleteResume?.resumeTitle}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
            >
              {deleteResume?.originalFileName}
            </Typography>
          </Paper>

          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The resume and its associated
            analysis records will be deleted.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDelete}
            color="inherit"
            disabled={deleteLoading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={
              deleteLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteOutline />
              )
            }
            onClick={handleDeleteResume}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Resume'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================
          PDF PREVIEW
      ====================================== */}

      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: '#202124',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* PDF TOOLBAR */}
        <Box
          sx={{
            minHeight: 68,
            px: { xs: 1.5, sm: 3 },
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            bgcolor: '#292a2d',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgba(244,67,54,0.15)',
                color: '#ff7770',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PictureAsPdfOutlined />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                fontWeight={700}
                noWrap
                sx={{ fontSize: { xs: 13, sm: 15 } }}
              >
                {previewResume?.resumeTitle || 'Resume Preview'}
              </Typography>

              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: 'rgba(255,255,255,0.55)',
                  display: 'block',
                  maxWidth: { xs: 150, sm: 400 },
                }}
              >
                {previewResume?.originalFileName}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            {previewResume && (
              <Tooltip title="Download original file">
                <IconButton
                  onClick={() => handleDownloadResume(previewResume)}
                  sx={{
                    color: '#fff',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <DownloadOutlined />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Close preview">
              <IconButton
                onClick={handleClosePreview}
                sx={{
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <CloseOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* DOCUMENT INFORMATION */}
        {previewResume && (
          <Box
            sx={{
              px: 3,
              py: 1,
              bgcolor: '#292a2d',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
            >
              <Chip
                size="small"
                icon={<InsertDriveFileOutlined />}
                label="PDF Document"
                sx={{
                  color: '#ddd',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  '& .MuiChip-icon': {
                    color: '#ff7770',
                  },
                }}
              />

              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {formatFileSize(previewResume.fileSizeBytes)}
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Uploaded {formatDate(previewResume.uploadDate)}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* PDF VIEWER */}
        <DialogContent
          sx={{
            p: { xs: 1, sm: 2 },
            bgcolor: '#3c4043',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          {previewLoading && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ flex: 1, color: '#fff' }}
              spacing={2}
            >
              <CircularProgress sx={{ color: '#90caf9' }} />

              <Typography color="inherit">
                Preparing your PDF preview...
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Please wait while your document loads.
              </Typography>
            </Stack>
          )}

          {previewError && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ flex: 1, p: 3 }}
              spacing={2}
            >
              <Alert
                severity="error"
                sx={{ maxWidth: 500, width: '100%' }}
              >
                {previewError}
              </Alert>

              <Button
                variant="outlined"
                onClick={handleClosePreview}
                sx={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                Close Preview
              </Button>
            </Stack>
          )}

          {!previewLoading && previewUrl && (
            <Paper
              elevation={8}
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                borderRadius: { xs: 1, sm: 2 },
                bgcolor: '#fff',
              }}
            >
              <Box
                component="iframe"
                src={previewUrl}
                title="Resume PDF Preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                  display: 'block',
                  bgcolor: '#fff',
                }}
              />
            </Paper>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================
          GLOBAL NOTIFICATION
      ====================================== */}

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() =>
          setNotification((previous) => ({
            ...previous,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() =>
            setNotification((previous) => ({
              ...previous,
              open: false,
            }))
          }
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MyResumes;