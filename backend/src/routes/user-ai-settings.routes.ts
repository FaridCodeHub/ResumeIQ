import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { authenticate } from '../middleware/auth.middleware.js';

import {
  getAISettingsController,
  saveAISettingsController,
  testAISettingsController,
  deleteAISettingsController,
} from '../controllers/user-ai-settings.controller.js';

const router = Router();

// All AI settings endpoints require authentication.
router.use(authenticate);

// Limit API-key testing to prevent excessive external API requests.
const testLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many API connection tests. Please try again later.',
  },
});

// Get current AI settings.
router.get('/', getAISettingsController);

// Save or update personal Gemini API settings.
router.put('/', saveAISettingsController);

// Test a Gemini API key.
router.post('/test', testLimiter, testAISettingsController);

// Remove personal Gemini API settings.
router.delete('/', deleteAISettingsController);

export default router;