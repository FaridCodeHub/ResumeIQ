import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { testDatabaseConnection } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import userAISettingsRoutes from './routes/user-ai-settings.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import jobRoutes from './routes/job.routes.js';
/*Admin based control */
import skillCatalogRoutes from './routes/skill-catalog.routes.js';
import adminAuditRoutes from './routes/admin-audit.routes.js';
const app = express();

const PORT = Number(process.env.PORT) || 5001;

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173';

// Trust proxy configuration should be enabled only when
// the application is deployed behind a trusted reverse proxy.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// CORS configuration
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ResumeIQ API is running!',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
// AI Setting
app.use('/api/user/ai-settings', userAISettingsRoutes);
//Skill Catalog
app.use('/api/admin/skills', skillCatalogRoutes);
// Analysis endpoint
app.use('/api/analysis', analysisRoutes);
// Admin Audit Logs
app.use('/api/admin/audit-logs', adminAuditRoutes);
// Start server after database connection
async function startServer(): Promise<void> {
  try {
    await testDatabaseConnection();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ResumeIQ API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start ResumeIQ API:', error);
    process.exit(1);
  }
}

startServer();