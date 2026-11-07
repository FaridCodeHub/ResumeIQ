import { Box, Typography, Paper } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';

interface PagePlaceholderProps {
  title: string;
  description: string;
}

function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 5,
        borderRadius: 3,
        border: '1px solid #E8E8F0',
        textAlign: 'center',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <ConstructionOutlinedIcon
          sx={{ fontSize: 48, color: '#635BFF' }}
        />
      </Box>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        {title}
      </Typography>

      <Typography color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
}

export default PagePlaceholder;

// This component will temporarily display a consistent message on unfinished pages.