import type { RequestHandler } from 'express';

import type { AuthenticatedUser } from '../middleware/auth.middleware.js';

import {
  getPendingSkillReviews,
  approveNewSkill,
  mapExistingSkill,
  rejectSkill,
  addSkillAlias,
  listSkills,
  getSkillById,
  updateSkill,
  setSkillStatus,
} from '../services/analysis/skill-catalog.service.js';

// ==================================================
// HELPERS
// ==================================================

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getAuthenticatedAdmin(
  req: Parameters<RequestHandler>[0],
): AuthenticatedUser | undefined {
  return req.res?.locals.authUser as
    | AuthenticatedUser
    | undefined;
}

function getRouteParameter(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// ==================================================
// GET PENDING SKILL REVIEWS
// ==================================================

export const getPendingSkillReviewsController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const pageValue = req.query.page ?? '1';
    const limitValue = req.query.limit ?? '20';

    const page = Number(pageValue);
    const limit = Number(limitValue);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters.',
      });
      return;
    }

    const result = await getPendingSkillReviews(page, limit);

    res.status(200).json({
      success: true,
      message: 'Pending skill reviews retrieved successfully.',
      ...result,
    });
  } catch (error) {
    console.error('Get pending skill reviews error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve pending skill reviews.',
    });
  }
};

// ==================================================
// APPROVE A NEW SKILL
// ==================================================

export const approveNewSkillController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const reviewId = getRouteParameter(req.params.reviewId);

    if (!reviewId || !UUID_REGEX.test(reviewId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid review ID.',
      });
      return;
    }

    const result = await approveNewSkill(
      reviewId,
      admin.userId,
    );

    res.status(200).json({
      success: true,
      message: 'New skill approved successfully.',
      skill: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '';

    if (message === 'Pending skill review not found.') {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (
      message === 'A canonical skill with this name already exists.' ||
      message === 'This skill name is already used as an alias.'
    ) {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    console.error('Approve new skill error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to approve this skill.',
    });
  }
};

// ==================================================
// MAP PROPOSED SKILL TO EXISTING SKILL
// ==================================================

export const mapExistingSkillController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const reviewId = getRouteParameter(req.params.reviewId);

    if (!reviewId || !UUID_REGEX.test(reviewId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid review ID.',
      });
      return;
    }

    const { targetSkillId, reviewNotes } = req.body as {
      targetSkillId?: unknown;
      reviewNotes?: unknown;
    };

    if (
      typeof targetSkillId !== 'string' ||
      !UUID_REGEX.test(targetSkillId)
    ) {
      res.status(400).json({
        success: false,
        message: 'A valid target skill ID is required.',
      });
      return;
    }

    if (
      reviewNotes !== undefined &&
      (typeof reviewNotes !== 'string' || reviewNotes.length > 2000)
    ) {
      res.status(400).json({
        success: false,
        message: 'Review notes must be text and cannot exceed 2000 characters.',
      });
      return;
    }

    const result = await mapExistingSkill(
      reviewId,
      targetSkillId,
      admin.userId,
      reviewNotes?.trim(),
    );

    res.status(200).json({
      success: true,
      message: 'Proposed skill mapped successfully.',
      mapping: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '';

    if (
      message === 'Pending skill review not found.' ||
      message === 'Active target skill not found.'
    ) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (
      message === 'A skill cannot be mapped to itself.' ||
      message === 'This proposed name already exists as a canonical skill.' ||
      message === 'This proposed name is already registered as an alias.'
    ) {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    console.error('Map existing skill error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to map this proposed skill.',
    });
  }
};

// ==================================================
// REJECT A PROPOSED SKILL
// ==================================================

export const rejectSkillController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const reviewId = getRouteParameter(req.params.reviewId);

    if (!reviewId || !UUID_REGEX.test(reviewId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid review ID.',
      });
      return;
    }

    const { reviewNotes } = req.body as {
      reviewNotes?: unknown;
    };

    if (
      reviewNotes !== undefined &&
      (typeof reviewNotes !== 'string' || reviewNotes.length > 2000)
    ) {
      res.status(400).json({
        success: false,
        message: 'Review notes must be text and cannot exceed 2000 characters.',
      });
      return;
    }

    await rejectSkill(
      reviewId,
      admin.userId,
      reviewNotes?.trim(),
    );

    res.status(200).json({
      success: true,
      message: 'Proposed skill rejected successfully.',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '';

    if (message === 'Pending skill review not found.') {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    console.error('Reject skill error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to reject this proposed skill.',
    });
  }
};

// ==================================================
// ADD ALIAS TO AN EXISTING SKILL
// ==================================================

export const addSkillAliasController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const skillId = getRouteParameter(req.params.skillId);

    if (!skillId || !UUID_REGEX.test(skillId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid skill ID.',
      });
      return;
    }

    const { aliasName } = req.body as {
      aliasName?: unknown;
    };

    if (
      typeof aliasName !== 'string' ||
      !aliasName.trim()
    ) {
      res.status(400).json({
        success: false,
        message: 'Alias name is required.',
      });
      return;
    }

    if (aliasName.trim().length > 150) {
      res.status(400).json({
        success: false,
        message: 'Alias name cannot exceed 150 characters.',
      });
      return;
    }

    const result = await addSkillAlias(skillId, aliasName, admin.userId);

    res.status(201).json({
      success: true,
      message: 'Skill alias added successfully.',
      alias: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '';

    if (message === 'Active skill not found.') {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (
      message.includes('already exists') ||
      message.includes('already registered') ||
      message.includes('identical') ||
      message.includes('too short')
    ) {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    console.error('Add skill alias error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to add this skill alias.',
    });
  }
};

// ==================================================
// LIST AND SEARCH SKILLS
// ==================================================

export const listSkillsController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const search = req.query.search;
    const category = req.query.category;
    const professionalField = req.query.professionalField;
    const isActive = req.query.isActive;

    if (
      search !== undefined &&
      typeof search !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid search parameter.',
      });
      return;
    }

    if (
      category !== undefined &&
      typeof category !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid category parameter.',
      });
      return;
    }

    if (
      professionalField !== undefined &&
      typeof professionalField !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid professional field parameter.',
      });
      return;
    }

    let activeFilter: boolean | undefined;

    if (isActive !== undefined) {
      if (isActive !== 'true' && isActive !== 'false') {
        res.status(400).json({
          success: false,
          message: 'isActive must be true or false.',
        });
        return;
      }

      activeFilter = isActive === 'true';
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters.',
      });
      return;
    }

    const result = await listSkills({
      search,
      category,
      professionalField,
      isActive: activeFilter,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: 'Skills retrieved successfully.',
      ...result,
    });
  } catch (error) {
    console.error('List skills error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve skills.',
    });
  }
};

// ==================================================
// UPDATE EXISTING SKILL
// ==================================================

export const updateSkillController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const skillId = getRouteParameter(req.params.skillId);

    if (!skillId || !UUID_REGEX.test(skillId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid skill ID.',
      });
      return;
    }

    const body = req.body as Record<string, unknown>;

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid request body.',
      });
      return;
    }

    const allowedFields = [
      'skillName',
      'category',
      'description',
      'professionalField',
      'parentSkillId',
    ];

    const invalidFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Unsupported fields: ${invalidFields.join(', ')}`,
      });
      return;
    }

    if (Object.keys(body).length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one field must be provided.',
      });
      return;
    }

    if (
      body.skillName !== undefined &&
      (
        typeof body.skillName !== 'string' ||
        !body.skillName.trim() ||
        body.skillName.trim().length > 150
      )
    ) {
      res.status(400).json({
        success: false,
        message: 'Skill name must contain 1–150 characters.',
      });
      return;
    }

    const nullableStringFields = [
      'category',
      'description',
      'professionalField',
      'parentSkillId',
    ];

    for (const field of nullableStringFields) {
      const value = body[field];

      if (
        value !== undefined &&
        value !== null &&
        typeof value !== 'string'
      ) {
        res.status(400).json({
          success: false,
          message: `${field} must be a string or null.`,
        });
        return;
      }
    }

    if (
      body.category !== undefined &&
      body.category !== null &&
      ![
        'technical',
        'soft',
        'language',
        'tool',
        'domain',
        'other',
      ].includes(body.category as string)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid skill category.',
      });
      return;
    }

    if (
      body.description !== undefined &&
      body.description !== null &&
      (body.description as string).length > 5000
    ) {
      res.status(400).json({
        success: false,
        message: 'Description cannot exceed 5000 characters.',
      });
      return;
    }

    if (
      body.professionalField !== undefined &&
      body.professionalField !== null &&
      (body.professionalField as string).length > 150
    ) {
      res.status(400).json({
        success: false,
        message: 'Professional field cannot exceed 150 characters.',
      });
      return;
    }

    if (
      body.parentSkillId !== undefined &&
      body.parentSkillId !== null &&
      !UUID_REGEX.test(body.parentSkillId as string)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid parent skill ID.',
      });
      return;
    }

    const result = await updateSkill(skillId, body, admin.userId);

    res.status(200).json({
      success: true,
      message: 'Skill updated successfully.',
      skill: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '';

    if (message === 'Skill not found.') {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (
      message.includes('already exists') ||
      message.includes('cannot be its own parent') ||
      message.includes('Parent skill not found') ||
      message.includes('category') ||
      message.includes('Skill name') ||
      message.includes('too short')
    ) {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    console.error('Update skill error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to update skill.',
    });
  }
};

// ==================================================
// ACTIVATE / DEACTIVATE SKILL
// ==================================================

export const setSkillStatusController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const skillId = getRouteParameter(req.params.skillId);

    if (!skillId || !UUID_REGEX.test(skillId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid skill ID.',
      });
      return;
    }

    const body = req.body as Record<string, unknown>;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({
        success: false,
        message: 'Invalid request body.',
      });
      return;
    }

    if (typeof body.isActive !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'isActive must be a boolean.',
      });
      return;
    }

    const skill = await setSkillStatus(skillId, body.isActive, admin.userId);

    res.status(200).json({
      success: true,
      message: body.isActive
        ? 'Skill activated successfully.'
        : 'Skill deactivated successfully.',
      skill,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Skill not found.') {
      res.status(404).json({ success: false, message });
      return;
    }

    if (message.includes('active child skills')) {
      res.status(409).json({ success: false, message });
      return;
    }

    console.error('Set skill status error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update skill status.',
    });
  }
};

// ==================================================
// GET SKILL DETAILS
// ==================================================

export const getSkillByIdController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const admin = getAuthenticatedAdmin(req);

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const skillId = getRouteParameter(req.params.skillId);

    if (!skillId || !UUID_REGEX.test(skillId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid skill ID.',
      });
      return;
    }

    const skill = await getSkillById(skillId);

    if (!skill) {
      res.status(404).json({
        success: false,
        message: 'Skill not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Skill details retrieved successfully.',
      skill,
    });
  } catch (error) {
    console.error('Get skill details error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve skill details.',
    });
  }
};