import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  CloudUploadOutlined,
  DescriptionOutlined,
  DeleteOutlineRounded,
  ArrowBackRounded,
  CheckCircleRounded,
  FolderOpenOutlined,
  AutoAwesomeRounded,
} from '@mui/icons-material';

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../services/api';

interface ResumeUploadProps {
  onBack: () => void;
}

interface UploadResponse {
  success: boolean;
  message: string;
  resume: {
    resumeId: string;
    resumeTitle: string;
    originalFileName: string;
    mimeType: string;
    fileSizeBytes: number;
    uploadDate: string;
    extractedText: string;
    pageCount: number | null;
  };
}

function ResumeUpload({ onBack }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResume, setUploadedResume] =
    useState<UploadResponse['resume'] | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;

    setError('');
    setUploadedResume(null);

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const isValidExtension = /\.(pdf|docx)$/i.test(file.name);

    const isValidType =
      allowedTypes.includes(file.type) ||
      (file.type === '' && isValidExtension);

    if (!isValidType || !isValidExtension) {
      setError('Please select a PDF or DOCX file.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be 5 MB or less.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!isUploading && !uploadedResume) {
      handleFile(event.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select your resume before continuing.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await apiRequest<UploadResponse>(
        '/resumes/upload',
        {
          method: 'POST',
          body: formData,
        },
      );

      setUploadedResume(response.resume);
      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err) {
      console.error('Resume upload failed:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to upload your resume. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAnother = () => {
    setUploadedResume(null);
    setSelectedFile(null);
    setError('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <Box
      sx={{
        bgcolor: '#F8FAFC',
        py: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={onBack}
          disabled={isUploading}
          sx={{
            mb: { xs: 2, sm: 3 },
            color: '#475569',
            textTransform: 'none',
          }}
        >
          Back to Dashboard
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.8rem', sm: '2.4rem' },
              fontWeight: 800,
              letterSpacing: '-1px',
              mb: 1.5,
              color: '#172033',
            }}
          >
            Upload your resume
          </Typography>

          <Typography color="text.secondary">
            Let ResumeIQ help you understand your career potential.
          </Typography>
        </Box>

        {!uploadedResume ? (
          <>
            <Paper
              elevation={0}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              sx={{
                p: { xs: 3, sm: 4 },
                border: '2px dashed #C7C9FF',
                borderRadius: 4,
                textAlign: 'center',
                bgcolor: '#FFFFFF',
                transition: '0.2s ease',
                '&:hover': {
                  borderColor: '#635BFF',
                  bgcolor: '#FCFCFF',
                },
              }}
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  mx: 'auto',
                  mb: 2,
                  borderRadius: 3,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: '#EEEDFF',
                  color: '#635BFF',
                }}
              >
                <CloudUploadOutlined sx={{ fontSize: 36 }} />
              </Box>

              <Typography variant="h6" fontWeight={800} mb={1}>
                Drag and drop your resume here
              </Typography>

              <Typography color="text.secondary" variant="body2" mb={3}>
                or select a file from your device
              </Typography>

              <input
                ref={inputRef}
                hidden
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) =>
                  handleFile(event.target.files?.[0])
                }
              />

              <Button
                variant="contained"
                startIcon={<CloudUploadOutlined />}
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                sx={{
                  bgcolor: '#635BFF',
                  px: 3,
                  py: 1.3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#5046E5',
                    boxShadow: 'none',
                  },
                }}
              >
                Choose Resume
              </Button>

              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{ mt: 2, lineHeight: 1.8 }}
              >
                Supported formats: PDF and DOCX
                <br />
                Maximum file size: 5 MB
              </Typography>
            </Paper>

            {selectedFile && (
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2,
                  border: '1px solid #E2E8F0',
                  borderRadius: 3,
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                  >
                    <DescriptionOutlined
                      sx={{ color: '#635BFF', fontSize: 30 }}
                    />

                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        {selectedFile.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    color="error"
                    disabled={isUploading}
                    onClick={() => {
                      setSelectedFile(null);
                      setError('');

                      if (inputRef.current) {
                        inputRef.current.value = '';
                      }
                    }}
                  >
                    <DeleteOutlineRounded />
                  </Button>
                </Stack>
              </Paper>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              sx={{
                mt: 2.5,
                py: 1.6,
                borderRadius: 2.5,
                bgcolor: '#635BFF',
                fontWeight: 700,
                fontSize: 15,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#5046E5',
                  boxShadow: 'none',
                },
              }}
            >
              {isUploading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={19} color="inherit" />
                  <span>Uploading and Processing...</span>
                </Stack>
              ) : (
                'Upload Resume'
              )}
            </Button>
          </>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              border: '1px solid #E2E8F0',
              borderRadius: 4,
              textAlign: 'center',
              bgcolor: '#FFFFFF',
            }}
          >
            <Box
              sx={{
                width: 76,
                height: 76,
                mx: 'auto',
                mb: 2.5,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#DCFCE7',
                color: '#16A34A',
              }}
            >
              <CheckCircleRounded sx={{ fontSize: 46 }} />
            </Box>

            <Typography variant="h5" fontWeight={800} mb={1}>
              Resume uploaded successfully!
            </Typography>

            <Typography color="text.secondary" mb={3}>
              Your resume has been securely stored and its text has been
              extracted successfully.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textAlign: 'left',
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 3,
                p: 2,
                mb: 3,
              }}
            >
              <DescriptionOutlined
                sx={{ fontSize: 32, color: '#635BFF' }}
              />

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={700} noWrap>
                  {uploadedResume.originalFileName}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {(uploadedResume.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                  {' • '}
                  Successfully processed
                </Typography>
              </Box>

              <CheckCircleRounded sx={{ color: '#16A34A' }} />
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
            >
              <Button
                fullWidth
                variant="contained"
                startIcon={<FolderOpenOutlined />}
                onClick={() => navigate('/resumes')}
                sx={{
                  py: 1.4,
                  bgcolor: '#635BFF',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#5046E5',
                    boxShadow: 'none',
                  },
                }}
              >
                View My Resumes
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<AutoAwesomeRounded />}
                onClick={handleUploadAnother}
                sx={{
                  py: 1.4,
                  borderRadius: 2,
                  borderColor: '#CBD5E1',
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Upload Another
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

export default ResumeUpload;