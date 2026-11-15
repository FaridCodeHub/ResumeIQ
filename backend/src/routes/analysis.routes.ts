import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { analysisRateLimiter } from '../middleware/analysis-rate-limit.middleware.js';

import {
  createGeneralAnalysisController,
  createJobSpecificAnalysisController,
} from '../controllers/analysis.controller.js';

import {
  getAnalysisHistoryController,
} from '../controllers/analysis-history.controller.js';

import {
  getAnalysisResultController,
} from '../controllers/analysis-result.controller.js';

const router = Router();

// All analysis endpoints require authentication.
router.use(authenticate);

// Analysis history — does not consume the AI rate limit.
router.get('/', getAnalysisHistoryController);
// Get one complete analysis result
router.get('/:analysisId', getAnalysisResultController);
// General resume analysis
router.post(
  '/general',
  analysisRateLimiter,
  createGeneralAnalysisController
);

// Job-specific resume analysis
router.post(
  '/job-specific',
  analysisRateLimiter,
  createJobSpecificAnalysisController
);

export default router;