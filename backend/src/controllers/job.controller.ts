import type { Request, Response } from 'express';
import { z } from 'zod';

import { pool } from '../config/db.js';
import type { PoolClient } from 'pg';

// ==================================================
// VALIDATION
// ==================================================

const jobSchema = z.object({
  jobTitle: z.string().trim().min(2).max(200),
  company: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().min(20),
  visibility: z.enum(['public', 'private']),
  skills: z.array(
    z.object({
      skillId: z.string().uuid(),
      requirementType: z.enum(['required', 'preferred']),
    }),
  ).min(1),
});

// ==================================================
// AUTHENTICATED USER
// ==================================================

function getUserId(res: Response): string | null {
  return res.locals.authUser?.userId ?? null;
}

// ==================================================
// HELPERS
// ==================================================

async function replaceJobSkills(
  client: PoolClient,
  jobId: string,
  skills: z.infer<typeof jobSchema>['skills'],
): Promise<void> {
  const skillIds = [...new Set(skills.map((skill) => skill.skillId))];

  if (skillIds.length !== skills.length) {
    throw new Error('Duplicate skills are not allowed.');
  }

  const activeSkills = await client.query(
    `
      SELECT skill_id
      FROM skills
      WHERE skill_id = ANY($1::uuid[])
        AND is_active = TRUE
    `,
    [skillIds],
  );

  if (activeSkills.rows.length !== skillIds.length) {
    throw new Error('One or more selected skills are unavailable.');
  }

  await client.query(
    'DELETE FROM job_skills WHERE job_id = $1',
    [jobId],
  );

  for (const skill of skills) {
    await client.query(
      `
        INSERT INTO job_skills (
          job_id,
          skill_id,
          requirement_type
        )
        VALUES ($1, $2, $3)
      `,
      [jobId, skill.skillId, skill.requirementType],
    );
  }
}

function handleJobError(error: unknown, res: Response): void {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '23503'
  ) {
    res.status(409).json({
      success: false,
      message: 'This job cannot be deleted because it is referenced by existing analyses.',
    });
    return;
  }

  console.error('Job management error:', error);

  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred while processing the job.',
  });
}

// ==================================================
// GET ALL ACCESSIBLE JOBS
// ==================================================

export async function getJobsController(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = getUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const result = await pool.query(
      `
        SELECT
          jd.job_id,
          jd.job_title,
          jd.company,
          jd.description,
          jd.user_id,
          jd.visibility,
          jd.created_at
        FROM job_descriptions jd
        WHERE (
          jd.visibility = 'public'
          OR jd.user_id = $1
        )
        AND EXISTS (
          SELECT 1
          FROM job_skills js
          INNER JOIN skills s
            ON s.skill_id = js.skill_id
          WHERE js.job_id = jd.job_id
            AND s.is_active = TRUE
        )
        ORDER BY jd.created_at DESC
      `,
      [userId],
    );

    res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully.',
      jobs: result.rows.map((job) => ({
        jobId: job.job_id,
        jobTitle: job.job_title,
        company: job.company,
        description: job.description,
        userId: job.user_id,
        visibility: job.visibility,
        isOwner: job.user_id === userId,
        isSystemJob: job.user_id === null,
        createdAt: job.created_at,
      })),
    });
  } catch (error) {
    handleJobError(error, res);
  }
}

// ==================================================
// GET JOB DETAILS
// ==================================================

export async function getJobByIdController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = getUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const result = await pool.query(
      `
        SELECT
          jd.job_id,
          jd.job_title,
          jd.company,
          jd.description,
          jd.user_id,
          jd.visibility,
          jd.created_at
        FROM job_descriptions jd
        WHERE jd.job_id = $1
          AND (
            jd.visibility = 'public'
            OR jd.user_id = $2
          )
        LIMIT 1
      `,
      [req.params.jobId, userId],
    );

    const job = result.rows[0];

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to access it.',
      });
      return;
    }

    const skills = await pool.query(
      `
        SELECT
          s.skill_id,
          s.skill_name,
          s.category,
          js.requirement_type
        FROM job_skills js
        INNER JOIN skills s
          ON s.skill_id = js.skill_id
        WHERE js.job_id = $1
          AND s.is_active = TRUE
        ORDER BY s.skill_name
      `,
      [job.job_id],
    );

    res.status(200).json({
      success: true,
      job: {
        jobId: job.job_id,
        jobTitle: job.job_title,
        company: job.company,
        description: job.description,
        visibility: job.visibility,
        isOwner: job.user_id === userId,
        isSystemJob: job.user_id === null,
        createdAt: job.created_at,
        skills: skills.rows.map((skill) => ({
          skillId: skill.skill_id,
          skillName: skill.skill_name,
          category: skill.category,
          requirementType: skill.requirement_type,
        })),
      },
    });
  } catch (error) {
    handleJobError(error, res);
  }
}

// ==================================================
// CREATE JOB
// ==================================================

export async function createJobController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = jobSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid job information.',
      errors: validation.error.issues,
    });
    return;
  }

  const userId = getUserId(res);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { jobTitle, company, description, visibility, skills } =
      validation.data;

    const result = await client.query(
      `
        INSERT INTO job_descriptions (
          user_id,
          job_title,
          company,
          description,
          visibility
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING job_id
      `,
      [
        userId,
        jobTitle,
        company?.trim() || null,
        description,
        visibility,
      ],
    );

    const jobId = result.rows[0].job_id;

    await replaceJobSkills(client, jobId, skills);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Job description created successfully.',
      jobId,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    handleJobError(error, res);
  } finally {
    client.release();
  }
}

// ==================================================
// UPDATE OWN JOB
// ==================================================

export async function updateJobController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = jobSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid job information.',
      errors: validation.error.issues,
    });
    return;
  }

  const userId = getUserId(res);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  const jobId = req.params.jobId;

  if (typeof jobId !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Invalid job ID.',
    });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { jobTitle, company, description, visibility, skills } =
      validation.data;

    const result = await client.query(
      `
        UPDATE job_descriptions
        SET
          job_title = $1,
          company = $2,
          description = $3,
          visibility = $4
        WHERE job_id = $5
          AND user_id = $6
        RETURNING job_id
      `,
      [
        jobTitle,
        company?.trim() || null,
        description,
        visibility,
        jobId,
        userId,
      ],
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');

      res.status(404).json({
        success: false,
        message: 'Job not found or you cannot edit this job.',
      });
      return;
    }

    await replaceJobSkills(
      client,
      jobId,
      skills,
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Job description updated successfully.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    handleJobError(error, res);
  } finally {
    client.release();
  }
}

// ==================================================
// DELETE OWN JOB
// ==================================================

export async function deleteJobController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(res);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  try {
    const result = await pool.query(
      `
        DELETE FROM job_descriptions
        WHERE job_id = $1
          AND user_id = $2
        RETURNING job_id
      `,
      [req.params.jobId, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Job not found or you cannot delete this job.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Job description deleted successfully.',
    });
  } catch (error) {
    handleJobError(error, res);
  }
}

// ==================================================
// DUPLICATE PUBLIC JOB
// ==================================================

export async function duplicateJobController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(res);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const source = await client.query(
      `
        SELECT
          job_title,
          company,
          description
        FROM job_descriptions
        WHERE job_id = $1
          AND visibility = 'public'
      `,
      [req.params.jobId],
    );

    if (source.rows.length === 0) {
      await client.query('ROLLBACK');

      res.status(404).json({
        success: false,
        message: 'Public job not found.',
      });
      return;
    }

    const job = source.rows[0];

    const copiedJob = await client.query(
      `
        INSERT INTO job_descriptions (
          user_id,
          job_title,
          company,
          description,
          visibility
        )
        VALUES ($1, $2, $3, $4, 'private')
        RETURNING job_id
      `,
      [
        userId,
        job.job_title,
        job.company,
        job.description,
      ],
    );

    const newJobId = copiedJob.rows[0].job_id;

    await client.query(
      `
        INSERT INTO job_skills (
          job_id,
          skill_id,
          requirement_type
        )
        SELECT
          $1,
          js.skill_id,
          js.requirement_type
        FROM job_skills js
        INNER JOIN skills s
          ON s.skill_id = js.skill_id
        WHERE js.job_id = $2
          AND s.is_active = TRUE
      `,
      [newJobId, req.params.jobId],
    );

    const copiedSkills = await client.query(
      'SELECT COUNT(*)::int AS count FROM job_skills WHERE job_id = $1',
      [newJobId],
    );

    if (copiedSkills.rows[0].count === 0) {
      throw new Error('This job has no active skills to duplicate.');
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Job duplicated successfully. Your copy is private by default.',
      jobId: newJobId,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    handleJobError(error, res);
  } finally {
    client.release();
  }
}