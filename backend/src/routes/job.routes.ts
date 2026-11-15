import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware.js';

import {
  getJobsController,
  getJobByIdController,
  createJobController,
  updateJobController,
  deleteJobController,
  duplicateJobController,
} from '../controllers/job.controller.js';

const router = Router();

// All job endpoints require authentication.
router.use(authenticate);

// List accessible jobs.
router.get('/', getJobsController);

// Create a job.
router.post('/', createJobController);

// Duplicate a public job.
router.post('/:jobId/duplicate', duplicateJobController);

// Get individual job details.
router.get('/:jobId', getJobByIdController);

// Update an owned job.
router.patch('/:jobId', updateJobController);

// Delete an owned job.
router.delete('/:jobId', deleteJobController);

export default router;