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
} from '@mui/icons-material';
import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { extractResumeText } from '../utils/resumeParser';
interface ResumeUploadProps {
  onBack: () => void;
}

function ResumeUpload({ onBack }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const handleFile = (file?: File) => {
    if (!file) return;

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

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be 5 MB or less.');
      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files[0]);
  };

    const handleContinue = async () => {
    if (!selectedFile) {
        setError('Please upload your resume before continuing.');
        return;
    }

    setError('');
    setIsExtracting(true);
    setResumeText('');

    try {
        const text = await extractResumeText(selectedFile);

        if (!text) {
        setError(
            'No readable text was found. If this is a scanned PDF, OCR support will be needed.',
        );
        return;
        }

        setResumeText(text);
    } catch (err) {
    console.error('Resume extraction failed:', err);

    const message =
        err instanceof Error ? err.message : 'Unknown error';

    setError(`Resume extraction failed: ${message}`);
    } finally {
        setIsExtracting(false);
    }
    };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F8FAFC',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={onBack}
          sx={{
            mb: 4,
            color: '#475569',
            textTransform: 'none',
          }}
        >
          Back to home
        </Button>

        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.7rem' },
              fontWeight: 800,
              letterSpacing: '-1px',
              mb: 2,
            }}
          >
            Upload your resume
          </Typography>

          <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
            Upload your resume to get started with ResumeIQ.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          sx={{
            p: { xs: 3, sm: 5 },
            border: '2px dashed #C7C9FF',
            borderRadius: 4,
            textAlign: 'center',
            bgcolor: '#FFFFFF',
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 3,
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              bgcolor: '#EEEDFF',
              color: '#635BFF',
            }}
          >
            <CloudUploadOutlined sx={{ fontSize: 38 }} />
          </Box>

        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        Drag and drop your resume here
        </Typography>

        <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
        or choose a file from your device
        </Typography>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Button
            variant="contained"
            startIcon={<CloudUploadOutlined />}
            onClick={() => inputRef.current?.click()}
            sx={{
            bgcolor: '#635BFF',
            px: 3,
            py: 1.4,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: '0 4px 10px rgba(99, 91, 255, 0.2)',
            '&:hover': {
                bgcolor: '#5046E5',
            },
            }}
        >
            Choose Resume
        </Button>

        <Typography
            variant="caption"
            display="block"
            color="text.secondary"
            sx={{
            mt: 2,
            textAlign: 'center',
            lineHeight: 1.7,
            }}
        >
            Supported formats: PDF and DOCX
            <br />
            Maximum file size: 5 MB
        </Typography>
        </Box>
        </Paper>

        {selectedFile && (
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 2.5,
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
                spacing={2}
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

                  <Typography variant="body2" color="text.secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Stack>

              <Button
                color="error"
                aria-label="Remove selected resume"
                onClick={() => {
                  setSelectedFile(null);
                  setError('');

                  if (inputRef.current) {
                    inputRef.current.value = '';
                  }
                }}
                sx={{ minWidth: 44 }}
              >
                <DeleteOutlineRounded />
              </Button>
            </Stack>
          </Paper>
        )}

        {error && (
          <Typography color="error" role="alert" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Button
        fullWidth
        variant="contained"
        onClick={handleContinue}
        disabled={isExtracting}
        sx={{
            mt: 3,
            py: 1.7,
            borderRadius: 2.5,
            bgcolor: '#635BFF',
            fontWeight: 700,
            fontSize: 16,
            textTransform: 'none',
            '&:hover': {
            bgcolor: '#5046E5',
            },
        }}
        >
        {isExtracting ? (
            <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} color="inherit" />
            <span>Reading Resume...</span>
            </Stack>
        ) : (
            'Continue to Analysis'
        )}
        </Button>
        {resumeText && (
        <Paper
            elevation={0}
            sx={{
            mt: 4,
            p: { xs: 2, sm: 3 },
            border: '1px solid #E2E8F0',
            borderRadius: 3,
            }}
        >
            <Typography variant="h6" fontWeight={800} mb={2}>
            Extracted Resume Text
            </Typography>

            <Alert severity="success" sx={{ mb: 2 }}>
            Your resume text was extracted successfully.
            </Alert>

            <Box
            sx={{
                maxHeight: 400,
                overflowY: 'auto',
                p: 2,
                bgcolor: '#F8FAFC',
                borderRadius: 2,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                fontSize: 14,
                lineHeight: 1.8,
            }}
            >
            {resumeText}
            </Box>
        </Paper>
        )}
      </Container>
    </Box>
  );
}

export default ResumeUpload;