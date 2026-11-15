import { pool } from '../../config/db.js';
import type { PoolClient } from 'pg';
import { createAdminAuditLog } from './admin-audit.service.js';
// ==================================================
// CONCURRENCY-SAFE SKILL NAME LOCK
// ==================================================

async function lockNormalizedSkillName(
  client: PoolClient,
  normalizedName: string,
): Promise<void> {
  await client.query(
    `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
    [normalizedName],
  );
}
// ==================================================
// TYPES
// ==================================================

export interface SkillReview {
  reviewId: string;
  proposedSkillName: string;
  normalizedName: string;
  category: string | null;
  description: string | null;
  source: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewReason: string;
  possibleMatches: string[];
  evidence: string | null;
  createdAt: Date;
}

interface SkillReviewRow {
  review_id: string;
  proposed_skill_name: string;
  normalized_name: string;
  category: string | null;
  description: string | null;
  source: string;
  status: 'pending' | 'approved' | 'rejected';
  review_reason: string;
  possible_matches: string[];
  evidence: string | null;
  created_at: Date;
}

// ==================================================
// GET PENDING SKILL REVIEWS
// ==================================================

export async function getPendingSkillReviews(
  page = 1,
  limit = 20,
): Promise<{
  reviews: SkillReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Page must be a positive integer.');
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error('Limit must be between 1 and 100.');
  }

  const offset = (page - 1) * limit;

  const [reviewsResult, countResult] = await Promise.all([
    pool.query<SkillReviewRow>(
      `
        SELECT
          review_id,
          proposed_skill_name,
          normalized_name,
          category,
          description,
          source,
          status,
          review_reason,
          possible_matches,
          evidence,
          created_at
        FROM skill_catalog_review
        WHERE status = 'pending'
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    ),

    pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM skill_catalog_review
        WHERE status = 'pending'
      `,
    ),
  ]);

  const reviews: SkillReview[] =
    reviewsResult.rows.map((row) => ({
      reviewId: row.review_id,
      proposedSkillName: row.proposed_skill_name,
      normalizedName: row.normalized_name,
      category: row.category,
      description: row.description,
      source: row.source,
      status: row.status,
      reviewReason: row.review_reason,
      possibleMatches: row.possible_matches,
      evidence: row.evidence,
      createdAt: row.created_at,
    }));

  const total = Number(countResult.rows[0]?.total ?? 0);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ==================================================
// APPROVE A NEW SKILL
// ==================================================

export async function approveNewSkill(
  reviewId: string,
  adminUserId: string,
): Promise<{
  skillId: string;
  skillName: string;
}> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock the pending review.
    const reviewResult = await client.query<SkillReviewRow>(
      `
        SELECT *
        FROM skill_catalog_review
        WHERE review_id = $1
          AND status = 'pending'
        FOR UPDATE
      `,
      [reviewId],
    );

    const review = reviewResult.rows[0];

    if (!review) {
      throw new Error('Pending skill review not found.');
    }

    await lockNormalizedSkillName(client, review.normalized_name);

    // 2. Generate the canonical normalized name.
    const normalizedName = review.normalized_name;

    // 3. Prevent duplicate canonical skills.
    const canonicalCheck = await client.query(
      `
        SELECT skill_id
        FROM skills
        WHERE normalized_name = $1
      `,
      [normalizedName],
    );

    if (canonicalCheck.rows.length > 0) {
      throw new Error(
        'A canonical skill with this name already exists.',
      );
    }

    // 4. Prevent collisions with existing aliases.
    const aliasCheck = await client.query(
      `
        SELECT alias_id
        FROM skill_aliases
        WHERE normalized_alias = $1
      `,
      [normalizedName],
    );

    if (aliasCheck.rows.length > 0) {
      throw new Error(
        'This skill name is already used as an alias.',
      );
    }

    // 5. Create the canonical skill.
    const skillResult = await client.query<{
      skill_id: string;
      skill_name: string;
    }>(
      `
        INSERT INTO skills (
          skill_name,
          normalized_name,
          category,
          description,
          professional_field
        )
        VALUES ($1, $2, $3, $4, NULL)
        RETURNING skill_id, skill_name
      `,
      [
        review.proposed_skill_name,
        normalizedName,
        review.category,
        review.description,
      ],
    );

    const newSkill = skillResult.rows[0];

    if (!newSkill) {
      throw new Error(
        'Failed to create the canonical skill.',
      );
    }

    // 6. Mark the review as approved.
    await client.query(
      `
        UPDATE skill_catalog_review
        SET
          status = 'approved',
          decision = 'approved_new',
          reviewed_by = $1,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          mapped_skill_id = NULL
        WHERE review_id = $2
      `,
      [adminUserId, reviewId],
    );

    // 7. Audit: record skill creation.
    await createAdminAuditLog(client, {
      adminUserId,
      action: 'skill_created',
      entityType: 'skill',
      entityId: newSkill.skill_id,
      oldValues: null,
      newValues: {
        skillName: newSkill.skill_name,
        normalizedName,
        category: review.category,
        description: review.description,
      },
      description: `Created skill "${newSkill.skill_name}" from an approved review.`,
    });

    // 8. Audit: record review approval.
    await createAdminAuditLog(client, {
      adminUserId,
      action: 'review_approved',
      entityType: 'skill_review',
      entityId: reviewId,
      oldValues: {
        status: 'pending',
      },
      newValues: {
        status: 'approved',
        decision: 'approved_new',
        skillId: newSkill.skill_id,
      },
      description: `Approved skill review for "${newSkill.skill_name}".`,
    });

    // 9. Commit everything together.
    await client.query('COMMIT');

    return {
      skillId: newSkill.skill_id,
      skillName: newSkill.skill_name,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ==================================================
// MAP PROPOSED SKILL TO EXISTING SKILL
// ==================================================

export async function mapExistingSkill(
  reviewId: string,
  targetSkillId: string,
  adminUserId: string,
  reviewNotes?: string,
): Promise<{
  skillId: string;
  skillName: string;
  aliasName: string;
}> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock the pending review.
    const reviewResult = await client.query<SkillReviewRow>(
      `
        SELECT *
        FROM skill_catalog_review
        WHERE review_id = $1
          AND status = 'pending'
        FOR UPDATE
      `,
      [reviewId],
    );

    const review = reviewResult.rows[0];

    if (!review) {
      throw new Error('Pending skill review not found.');
    }

    // 2. Lock the proposed name.
    await lockNormalizedSkillName(client, review.normalized_name);

    // 3. Lock and retrieve the target canonical skill.
    const skillResult = await client.query<{
      skill_id: string;
      skill_name: string;
      normalized_name: string;
      is_active: boolean;
    }>(
      `
        SELECT
          skill_id,
          skill_name,
          normalized_name,
          is_active
        FROM skills
        WHERE skill_id = $1
        FOR UPDATE
      `,
      [targetSkillId],
    );

    const targetSkill = skillResult.rows[0];

    if (!targetSkill || !targetSkill.is_active) {
      throw new Error('Active target skill not found.');
    }

    // 4. Prevent mapping a skill to itself.
    if (review.normalized_name === targetSkill.normalized_name) {
      throw new Error('A skill cannot be mapped to itself.');
    }

    // 5. Prevent canonical-name collisions.
    const canonicalCheck = await client.query(
      `
        SELECT skill_id
        FROM skills
        WHERE normalized_name = $1
      `,
      [review.normalized_name],
    );

    if (canonicalCheck.rows.length > 0) {
      throw new Error(
        'This proposed name already exists as a canonical skill.',
      );
    }

    // 6. Prevent alias collisions.
    const aliasCheck = await client.query(
      `
        SELECT alias_id
        FROM skill_aliases
        WHERE normalized_alias = $1
      `,
      [review.normalized_name],
    );

    if (aliasCheck.rows.length > 0) {
      throw new Error(
        'This proposed name is already registered as an alias.',
      );
    }

    // 7. Create the alias.
    await client.query(
      `
        INSERT INTO skill_aliases (
          skill_id,
          alias_name,
          normalized_alias
        )
        VALUES ($1, $2, $3)
      `,
      [
        targetSkill.skill_id,
        review.proposed_skill_name,
        review.normalized_name,
      ],
    );

    // 8. Record the administrator's decision.
    await client.query(
      `
        UPDATE skill_catalog_review
        SET
          status = 'approved',
          decision = 'mapped_existing',
          reviewed_by = $1,
          mapped_skill_id = $2,
          review_notes = $3,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE review_id = $4
      `,
      [
        adminUserId,
        targetSkill.skill_id,
        reviewNotes ?? null,
        reviewId,
      ],
    );

    // 9. Audit: record the alias creation.
    await createAdminAuditLog(client, {
      adminUserId,
      action: 'skill_alias_added',
      entityType: 'skill',
      entityId: targetSkill.skill_id,
      oldValues: null,
      newValues: {
        aliasName: review.proposed_skill_name,
        normalizedAlias: review.normalized_name,
      },
      description: `Added "${review.proposed_skill_name}" as an alias for "${targetSkill.skill_name}".`,
    });

    // 10. Audit: record the review mapping.
    await createAdminAuditLog(client, {
      adminUserId,
      action: 'review_mapped',
      entityType: 'skill_review',
      entityId: reviewId,
      oldValues: {
        status: 'pending',
        mappedSkillId: null,
      },
      newValues: {
        status: 'approved',
        decision: 'mapped_existing',
        mappedSkillId: targetSkill.skill_id,
      },
      description: `Mapped skill review "${review.proposed_skill_name}" to "${targetSkill.skill_name}".`,
    });

    // 11. Commit everything together.
    await client.query('COMMIT');

    return {
      skillId: targetSkill.skill_id,
      skillName: targetSkill.skill_name,
      aliasName: review.proposed_skill_name,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ==================================================
// REJECT A PROPOSED SKILL
// ==================================================

export async function rejectSkill(
  reviewId: string,
  adminUserId: string,
  reviewNotes?: string,
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock the pending review.
    const reviewResult = await client.query<{
      review_id: string;
      proposed_skill_name: string;
      status: string;
    }>(
      `
        SELECT
          review_id,
          proposed_skill_name,
          status
        FROM skill_catalog_review
        WHERE review_id = $1
          AND status = 'pending'
        FOR UPDATE
      `,
      [reviewId],
    );

    const review = reviewResult.rows[0];

    if (!review) {
      throw new Error('Pending skill review not found.');
    }

    // 2. Record the rejection.
    await client.query(
      `
        UPDATE skill_catalog_review
        SET
          status = 'rejected',
          decision = 'rejected',
          reviewed_by = $1,
          mapped_skill_id = NULL,
          review_notes = $2,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE review_id = $3
      `,
      [
        adminUserId,
        reviewNotes ?? null,
        reviewId,
      ],
    );

    // 3. Audit: record the rejection.
    await createAdminAuditLog(client, {
      adminUserId,
      action: 'review_rejected',
      entityType: 'skill_review',
      entityId: reviewId,
      oldValues: {
        status: review.status,
      },
      newValues: {
        status: 'rejected',
        decision: 'rejected',
        reviewNotes: reviewNotes ?? null,
      },
      description: `Rejected proposed skill "${review.proposed_skill_name}".`,
    });

    // 4. Commit everything together.
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ==================================================
// ADD ALIAS TO AN EXISTING SKILL
// ==================================================

export async function addSkillAlias(
  skillId: string,
  aliasName: string,
  adminUserId: string,
): Promise<{
  aliasId: string;
  skillId: string;
  skillName: string;
  aliasName: string;
}> {
  const normalizedAlias = aliasName
    .toLowerCase()
    .trim()
    .replace(/[\s_.-]+/g, '');

  if (!aliasName.trim()) {
    throw new Error('Alias name cannot be empty.');
  }

  if (aliasName.trim().length > 150) {
    throw new Error('Alias name cannot exceed 150 characters.');
  }

  if (normalizedAlias.length < 2) {
    throw new Error('Alias name is too short.');
  }

  const client = await pool.connect();

  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    // 1. Lock the normalized name.
    await lockNormalizedSkillName(client, normalizedAlias);

    // 2. Lock and retrieve the target skill.
    const skillResult = await client.query<{
      skill_id: string;
      skill_name: string;
      normalized_name: string;
      is_active: boolean;
    }>(
      `
        SELECT
          skill_id,
          skill_name,
          normalized_name,
          is_active
        FROM skills
        WHERE skill_id = $1
        FOR UPDATE
      `,
      [skillId],
    );

    const skill = skillResult.rows[0];

    if (!skill || !skill.is_active) {
      throw new Error('Active skill not found.');
    }

    // 3. Prevent canonical-name duplication.
    if (skill.normalized_name === normalizedAlias) {
      throw new Error(
        'Alias cannot be identical to the canonical skill name.',
      );
    }

    // 4. Check canonical skill names.
    const canonicalCheck = await client.query(
      `
        SELECT skill_id
        FROM skills
        WHERE normalized_name = $1
      `,
      [normalizedAlias],
    );

    if (canonicalCheck.rows.length > 0) {
      throw new Error(
        'This name already exists as a canonical skill.',
      );
    }

    // 5. Check existing aliases.
    const aliasCheck = await client.query(
      `
        SELECT alias_id
        FROM skill_aliases
        WHERE normalized_alias = $1
      `,
      [normalizedAlias],
    );

    if (aliasCheck.rows.length > 0) {
      throw new Error('This alias is already registered.');
    }

    // 6. Insert the new alias.
    const aliasResult = await client.query<{
      alias_id: string;
    }>(
      `
        INSERT INTO skill_aliases (
          skill_id,
          alias_name,
          normalized_alias
        )
        VALUES ($1, $2, $3)
        RETURNING alias_id
      `,
      [skillId, aliasName.trim(), normalizedAlias],
    );

    const newAlias = aliasResult.rows[0];

    if (!newAlias) {
      throw new Error('Failed to create skill alias.');
    }

    // 7. Record the audit event.
    await createAdminAuditLog(client, {
      adminUserId,
      action: 'skill_alias_added',
      entityType: 'skill',
      entityId: skill.skill_id,
      oldValues: null,
      newValues: {
        aliasId: newAlias.alias_id,
        aliasName: aliasName.trim(),
        normalizedAlias,
      },
      description: `Added "${aliasName.trim()}" as an alias for "${skill.skill_name}".`,
    });

    // 8. Commit everything together.
    await client.query('COMMIT');
    transactionStarted = false;

    return {
      aliasId: newAlias.alias_id,
      skillId: skill.skill_id,
      skillName: skill.skill_name,
      aliasName: aliasName.trim(),
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }

    throw error;
  } finally {
    client.release();
  }
}

// ==================================================
// LIST AND SEARCH SKILLS
// ==================================================

export interface SkillCatalogItem {
  skillId: string;
  skillName: string;
  category: string | null;
  description: string | null;
  professionalField: string | null;
  parentSkillId: string | null;
  isActive: boolean;
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SkillCatalogRow {
  skill_id: string;
  skill_name: string;
  category: string | null;
  description: string | null;
  professional_field: string | null;
  parent_skill_id: string | null;
  is_active: boolean;
  aliases: string[];
  created_at: Date;
  updated_at: Date;
}

export interface SkillCatalogFilters {
  search?: string;
  category?: string;
  professionalField?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function listSkills(
  filters: SkillCatalogFilters = {},
): Promise<{
  skills: SkillCatalogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Page must be a positive integer.');
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error('Limit must be between 1 and 100.');
  }

  const conditions: string[] = [];
  const values: unknown[] = [];

  function addFilter(value: unknown, condition: string): void {
    values.push(value);
    conditions.push(condition.replace('?', `$${values.length}`));
  }

  if (filters.search?.trim()) {
    addFilter(
      `%${filters.search.trim()}%`,
      `(
        s.skill_name ILIKE ?
        OR EXISTS (
          SELECT 1
          FROM skill_aliases search_alias
          WHERE search_alias.skill_id = s.skill_id
          AND search_alias.alias_name ILIKE ?
        )
      )`,
    );

    // The alias condition needs its own parameter.
    values.push(`%${filters.search.trim()}%`);
    conditions[conditions.length - 1] =
      `(
        s.skill_name ILIKE $${values.length - 1}
        OR EXISTS (
          SELECT 1
          FROM skill_aliases search_alias
          WHERE search_alias.skill_id = s.skill_id
          AND search_alias.alias_name ILIKE $${values.length}
        )
      )`;
  }

  if (filters.category?.trim()) {
    addFilter(
      filters.category.trim(),
      's.category = ?',
    );
  }

  if (filters.professionalField?.trim()) {
    addFilter(
      filters.professionalField.trim(),
      's.professional_field = ?',
    );
  }

  if (filters.isActive !== undefined) {
    addFilter(
      filters.isActive,
      's.is_active = ?',
    );
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

  const countResult = await pool.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM skills s
      ${whereClause}
    `,
    values,
  );

  const total = Number(countResult.rows[0]?.total ?? 0);
  const offset = (page - 1) * limit;

  const dataValues = [...values, limit, offset];

  const result = await pool.query<SkillCatalogRow>(
    `
      SELECT
        s.skill_id,
        s.skill_name,
        s.category,
        s.description,
        s.professional_field,
        s.parent_skill_id,
        s.is_active,
        s.created_at,
        s.updated_at,
        COALESCE(
          ARRAY_AGG(sa.alias_name)
            FILTER (WHERE sa.alias_id IS NOT NULL),
          '{}'
        ) AS aliases
      FROM skills s
      LEFT JOIN skill_aliases sa
        ON sa.skill_id = s.skill_id
      ${whereClause}
      GROUP BY s.skill_id
      ORDER BY s.skill_name ASC
      LIMIT $${dataValues.length - 1}
      OFFSET $${dataValues.length}
    `,
    dataValues,
  );

  return {
    skills: result.rows.map((row) => ({
      skillId: row.skill_id,
      skillName: row.skill_name,
      category: row.category,
      description: row.description,
      professionalField: row.professional_field,
      parentSkillId: row.parent_skill_id,
      isActive: row.is_active,
      aliases: row.aliases,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ==================================================
// GET SKILL BY ID
// ==================================================

export async function getSkillById(
  skillId: string,
): Promise<SkillCatalogItem | null> {
  const result = await pool.query<SkillCatalogRow>(
    `
      SELECT
        s.skill_id,
        s.skill_name,
        s.category,
        s.description,
        s.professional_field,
        s.parent_skill_id,
        s.is_active,
        s.created_at,
        s.updated_at,
        COALESCE(
          ARRAY_AGG(sa.alias_name)
            FILTER (WHERE sa.alias_id IS NOT NULL),
          '{}'
        ) AS aliases
      FROM skills s
      LEFT JOIN skill_aliases sa
        ON sa.skill_id = s.skill_id
      WHERE s.skill_id = $1
      GROUP BY s.skill_id
    `,
    [skillId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    skillId: row.skill_id,
    skillName: row.skill_name,
    category: row.category,
    description: row.description,
    professionalField: row.professional_field,
    parentSkillId: row.parent_skill_id,
    isActive: row.is_active,
    aliases: row.aliases,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
// ==================================================
// UPDATE EXISTING SKILL
// ==================================================

export interface UpdateSkillInput {
  skillName?: string;
  category?: string | null;
  description?: string | null;
  professionalField?: string | null;
  parentSkillId?: string | null;
}

export async function updateSkill(
  skillId: string,
  input: UpdateSkillInput,
  adminUserId: string,
): Promise<SkillCatalogItem> {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    // 1. Lock the existing skill.
    const existingResult = await client.query<{
      skill_id: string;
      skill_name: string;
      normalized_name: string;
      category: string | null;
      description: string | null;
      professional_field: string | null;
      parent_skill_id: string | null;
      is_active: boolean;
    }>(
      `
        SELECT
          skill_id,
          skill_name,
          normalized_name,
          category,
          description,
          professional_field,
          parent_skill_id,
          is_active
        FROM skills
        WHERE skill_id = $1
        FOR UPDATE
      `,
      [skillId],
    );

    const existing = existingResult.rows[0];

    if (!existing) {
      throw new Error('Skill not found.');
    }

    // 2. Calculate updated values.
    const skillName =
      input.skillName?.trim() ?? existing.skill_name;

    const normalizedName = skillName
      .toLowerCase()
      .replace(/[\s_.-]+/g, '');

    const category =
      input.category === undefined
        ? existing.category
        : input.category;

    const description =
      input.description === undefined
        ? existing.description
        : input.description;

    const professionalField =
      input.professionalField === undefined
        ? existing.professional_field
        : input.professionalField;

    const parentSkillId =
      input.parentSkillId === undefined
        ? existing.parent_skill_id
        : input.parentSkillId;

    // 3. Validate skill name.
    if (!skillName) {
      throw new Error('Skill name cannot be empty.');
    }

    if (skillName.length > 150) {
      throw new Error('Skill name cannot exceed 150 characters.');
    }

    if (normalizedName.length < 2) {
      throw new Error('Skill name is too short.');
    }

    // 4. Validate category.
    const allowedCategories = [
      'technical',
      'soft',
      'language',
      'tool',
      'domain',
      'other',
    ];

    if (
      category !== null &&
      category !== undefined &&
      !allowedCategories.includes(category)
    ) {
      throw new Error('Invalid skill category.');
    }

    // 5. Prevent duplicate names.
    await lockNormalizedSkillName(client, normalizedName);

    const duplicateResult = await client.query(
      `
        SELECT skill_id
        FROM skills
        WHERE normalized_name = $1
          AND skill_id <> $2

        UNION ALL

        SELECT skill_id
        FROM skill_aliases
        WHERE normalized_alias = $1
      `,
      [normalizedName, skillId],
    );

    if (duplicateResult.rows.length > 0) {
      throw new Error(
        'This skill name already exists as a skill or alias.',
      );
    }

    // 6. Validate parent skill.
    if (parentSkillId !== null) {
      if (parentSkillId === skillId) {
        throw new Error('A skill cannot be its own parent.');
      }

      const parentResult = await client.query(
        `
          SELECT skill_id
          FROM skills
          WHERE skill_id = $1
            AND is_active = TRUE
        `,
        [parentSkillId],
      );

      if (parentResult.rows.length === 0) {
        throw new Error('Active parent skill not found.');
      }
    }

    // 7. Update the skill.
    const updatedResult = await client.query(
      `
        UPDATE skills
        SET
          skill_name = $1,
          normalized_name = $2,
          category = $3,
          description = $4,
          professional_field = $5,
          parent_skill_id = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE skill_id = $7
        RETURNING
          skill_id,
          skill_name,
          category,
          description,
          professional_field,
          parent_skill_id,
          is_active,
          created_at,
          updated_at
      `,
      [
        skillName,
        normalizedName,
        category,
        description,
        professionalField,
        parentSkillId,
        skillId,
      ],
    );

    const updated = updatedResult.rows[0];

    if (!updated) {
      throw new Error('Failed to update skill.');
    }

    // 8. Retrieve aliases.
    const aliasesResult = await client.query<{
      alias_name: string;
    }>(
      `
        SELECT alias_name
        FROM skill_aliases
        WHERE skill_id = $1
        ORDER BY alias_name ASC
      `,
      [skillId],
    );

    // 9. Audit: record before-and-after values.
    await createAdminAuditLog(client, {
      adminUserId,
      action: 'skill_updated',
      entityType: 'skill',
      entityId: skillId,
      oldValues: {
        skillName: existing.skill_name,
        category: existing.category,
        description: existing.description,
        professionalField: existing.professional_field,
        parentSkillId: existing.parent_skill_id,
      },
      newValues: {
        skillName: updated.skill_name,
        category: updated.category,
        description: updated.description,
        professionalField: updated.professional_field,
        parentSkillId: updated.parent_skill_id,
      },
      description: `Updated skill "${updated.skill_name}".`,
    });

    // 10. Commit everything together.
    await client.query('COMMIT');
    transactionStarted = false;

    return {
      skillId: updated.skill_id,
      skillName: updated.skill_name,
      category: updated.category,
      description: updated.description,
      professionalField: updated.professional_field,
      parentSkillId: updated.parent_skill_id,
      isActive: updated.is_active,
      aliases: aliasesResult.rows.map(
        (row) => row.alias_name,
      ),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }

    throw error;
  } finally {
    client.release();
  }
}

// ==================================================
// ACTIVATE / DEACTIVATE SKILL
// ==================================================

export async function setSkillStatus(
  skillId: string,
  isActive: boolean,
  adminUserId: string,
): Promise<{
  skillId: string;
  skillName: string;
  isActive: boolean;
  updatedAt: Date;
}> {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    // 1. Lock and retrieve the skill.
    const skillResult = await client.query<{
      skill_id: string;
      skill_name: string;
      is_active: boolean;
    }>(
      `
        SELECT
          skill_id,
          skill_name,
          is_active
        FROM skills
        WHERE skill_id = $1
        FOR UPDATE
      `,
      [skillId],
    );

    const skill = skillResult.rows[0];

    if (!skill) {
      throw new Error('Skill not found.');
    }

    // 2. Prevent deactivating a parent with active children.
    if (!isActive) {
      const childrenResult = await client.query(
        `
          SELECT skill_id
          FROM skills
          WHERE parent_skill_id = $1
            AND is_active = TRUE
          LIMIT 1
        `,
        [skillId],
      );

      if (childrenResult.rows.length > 0) {
        throw new Error(
          'Cannot deactivate a skill that has active child skills.',
        );
      }
    }

    // 3. Update status.
    const updatedResult = await client.query<{
      skill_id: string;
      skill_name: string;
      is_active: boolean;
      updated_at: Date;
    }>(
      `
        UPDATE skills
        SET
          is_active = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE skill_id = $2
        RETURNING
          skill_id,
          skill_name,
          is_active,
          updated_at
      `,
      [isActive, skillId],
    );

    const updated = updatedResult.rows[0];

    if (!updated) {
      throw new Error('Failed to update skill status.');
    }

    // 4. Record the audit event.
    await createAdminAuditLog(client, {
      adminUserId,
      action: isActive
        ? 'skill_activated'
        : 'skill_deactivated',
      entityType: 'skill',
      entityId: skillId,
      oldValues: {
        isActive: skill.is_active,
      },
      newValues: {
        isActive: updated.is_active,
      },
      description: `${isActive ? 'Activated' : 'Deactivated'} skill "${updated.skill_name}".`,
    });

    // 5. Commit everything together.
    await client.query('COMMIT');
    transactionStarted = false;

    return {
      skillId: updated.skill_id,
      skillName: updated.skill_name,
      isActive: updated.is_active,
      updatedAt: updated.updated_at,
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }

    throw error;
  } finally {
    client.release();
  }
}