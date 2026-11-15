import { Router } from 'express';

import {
  authenticate,
  authorizeRoles,
} from '../middleware/auth.middleware.js';

import {
  getPendingSkillReviewsController,
  approveNewSkillController,
  mapExistingSkillController,
  rejectSkillController,
  addSkillAliasController,
  listSkillsController,
  getSkillByIdController,
  updateSkillController,
  setSkillStatusController,
} from '../controllers/skill-catalog.controller.js';

const router = Router();

// All skill catalog routes require authentication.
router.use(authenticate);

// Regular authenticated users can view and search the skill catalog.
// We will request only active skills from the frontend.
router.get('/', listSkillsController);

// Everything below this point requires admin access.
router.use(authorizeRoles('admin'));

// Get pending skill reviews.
router.get(
  '/reviews',
  getPendingSkillReviewsController,
);

// Approve a proposed skill as a new canonical skill.
router.post(
  '/reviews/:reviewId/approve',
  approveNewSkillController,
);

// Map a proposed skill to an existing canonical skill.
router.post(
  '/reviews/:reviewId/map',
  mapExistingSkillController,
);

// Reject a proposed skill.
router.post(
  '/reviews/:reviewId/reject',
  rejectSkillController,
);

// Get individual skill details.
router.get(
  '/:skillId',
  getSkillByIdController,
);

// Add an alias to an existing skill.
router.post(
  '/:skillId/aliases',
  addSkillAliasController,
);

// Update a skill.
router.patch(
  '/:skillId',
  updateSkillController,
);

// Activate or deactivate a skill.
router.patch(
  '/:skillId/status',
  setSkillStatusController,
);

export default router;