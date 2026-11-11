import type { RequestHandler } from 'express';
import type { QueryResultRow } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';

import { pool } from '../config/db.js';
import type { AuthenticatedUser } from '../middleware/auth.middleware.js';

import {
  extractResumeText,
  ResumeExtractionError,
} from '../services/resume.service.js';
import { fileURLToPath } from 'node:url';
interface ResumeRow extends QueryResultRow {
  resume_id: string;
  resume_title: string;
  original_file_name: string;
  mime_type: string;
  file_size_bytes: string;
  upload_date: Date;
}

interface ResumeListRow extends QueryResultRow {
  resume_id: string;
  resume_title: string;
  original_file_name: string | null;
  mime_type: string | null;
  file_size_bytes: string | null;
  upload_date: Date;
}

interface UploadResumeResponse {
  success: boolean;
  message: string;
  resume: {
    resumeId: string;
    resumeTitle: string;
    originalFileName: string;
    mimeType: string;
    fileSizeBytes: number;
    uploadDate: Date;
    extractedText: string;
    pageCount: number | null;
  };
}

const MAX_TITLE_LENGTH = 200;

function getAuthenticatedUser(
  request: Parameters<RequestHandler>[0],
): AuthenticatedUser | undefined {
  return request.res?.locals.authUser as
    | AuthenticatedUser
    | undefined;
}

// ==========================================
// UPLOAD RESUME
// ==========================================

export const uploadResumeController: RequestHandler = async (
  req,
  res,
) => {
  let uploadedFilePath: string | null = null;

  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Please select a PDF or DOCX resume.',
      });
      return;
    }

    uploadedFilePath = file.path;

    const extractedResume = await extractResumeText(
      file.path,
      file.mimetype,
    );

    const originalFileName = path
      .basename(file.originalname)
      .slice(0, 255);

    const resumeTitle =
      path.parse(originalFileName).name.slice(0, MAX_TITLE_LENGTH) ||
      'My Resume';

    const result = await pool.query<ResumeRow>(
      `INSERT INTO resumes (
        user_id,
        resume_title,
        file_path,
        original_file_name,
        mime_type,
        file_size_bytes,
        extracted_text
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        resume_id,
        resume_title,
        original_file_name,
        mime_type,
        file_size_bytes,
        upload_date`,
      [
        user.userId,
        resumeTitle,
        file.filename,
        originalFileName,
        file.mimetype,
        file.size,
        extractedResume.text,
      ],
    );

    const savedResume = result.rows[0];

    if (!savedResume) {
      throw new Error('Resume could not be saved.');
    }

    const response: UploadResumeResponse = {
      success: true,
      message: 'Resume uploaded and processed successfully.',
      resume: {
        resumeId: savedResume.resume_id,
        resumeTitle: savedResume.resume_title,
        originalFileName: savedResume.original_file_name,
        mimeType: savedResume.mime_type,
        fileSizeBytes: Number(savedResume.file_size_bytes),
        uploadDate: savedResume.upload_date,
        extractedText: extractedResume.text,
        pageCount: extractedResume.pageCount,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupError) {
        console.error(
          'Failed to remove uploaded resume:',
          cleanupError,
        );
      }
    }

    if (error instanceof ResumeExtractionError) {
      res.status(422).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Resume upload controller error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to upload your resume. Please try again.',
    });
  }
};

// ==========================================
// GET ALL RESUMES FOR AUTHENTICATED USER
// ==========================================

export const getUserResumesController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const result = await pool.query<ResumeListRow>(
      `SELECT
        resume_id,
        resume_title,
        original_file_name,
        mime_type,
        file_size_bytes,
        upload_date
       FROM resumes
       WHERE user_id = $1
       ORDER BY upload_date DESC`,
      [user.userId],
    );

    const resumes = result.rows.map((row) => ({
      resumeId: row.resume_id,
      resumeTitle: row.resume_title,
      originalFileName: row.original_file_name,
      mimeType: row.mime_type,
      fileSizeBytes: Number(row.file_size_bytes ?? 0),
      uploadDate: row.upload_date,
    }));

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes,
    });
  } catch (error) {
    console.error('Get user resumes error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve your resumes.',
    });
  }
};
// ==========================================
// GET SINGLE RESUME WITH EXTRACTED TEXT
// ==========================================

interface ResumeDetailRow extends QueryResultRow {
  resume_id: string;
  resume_title: string;
  original_file_name: string | null;
  mime_type: string | null;
  file_size_bytes: string | null;
  upload_date: Date;
  extracted_text: string | null;
}

export const getResumeDetailsController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const resumeId = Array.isArray(req.params.resumeId)
      ? req.params.resumeId[0]
      : req.params.resumeId;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!resumeId || !uuidRegex.test(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID.',
      });
      return;
    }

    const result = await pool.query<ResumeDetailRow>(
      `SELECT
        resume_id,
        resume_title,
        original_file_name,
        mime_type,
        file_size_bytes,
        upload_date,
        extracted_text
       FROM resumes
       WHERE resume_id = $1
       AND user_id = $2`,
      [resumeId, user.userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
      return;
    }

    const resume = result.rows[0];

    if (!resume) {
    res.status(404).json({
        success: false,
        message: 'Resume not found.',
    });
    return;
    }
    res.status(200).json({
      success: true,
      resume: {
        resumeId: resume.resume_id,
        resumeTitle: resume.resume_title,
        originalFileName: resume.original_file_name,
        mimeType: resume.mime_type,
        fileSizeBytes: Number(resume.file_size_bytes ?? 0),
        uploadDate: resume.upload_date,
        extractedText: resume.extracted_text ?? '',
      },
    });
  } catch (error) {
    console.error('Get resume details error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve resume details.',
    });
  }
};

// ==========================================
// PRIVATE RESUME STORAGE
// ==========================================

const CURRENT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));

const RESUME_STORAGE_DIRECTORY = path.resolve(
  CURRENT_DIRECTORY,
  '../../storage/resumes',
);

interface ResumeFileRow extends QueryResultRow {
  resume_id: string;
  file_path: string;
  original_file_name: string | null;
  mime_type: string | null;
}

// Retrieve a resume file belonging to the authenticated user.
async function getOwnedResumeFile(
  resumeId: string,
  userId: string,
): Promise<ResumeFileRow | null> {
  const result = await pool.query<ResumeFileRow>(
    `SELECT
      resume_id,
      file_path,
      original_file_name,
      mime_type
     FROM resumes
     WHERE resume_id = $1
     AND user_id = $2`,
    [resumeId, userId],
  );

  return result.rows[0] ?? null;
}

// Safely resolve a stored filename inside the private storage directory.
function getSafeResumeFilePath(filename: string): string | null {
  if (!filename || path.basename(filename) !== filename) {
    return null;
  }

  const resolvedPath = path.resolve(
    RESUME_STORAGE_DIRECTORY,
    filename,
  );

  if (path.dirname(resolvedPath) !== RESUME_STORAGE_DIRECTORY) {
    return null;
  }

  return resolvedPath;
}

// ==========================================
// PREVIEW ORIGINAL RESUME
// ==========================================

export const previewResumeController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const resumeId = Array.isArray(req.params.resumeId)
      ? req.params.resumeId[0]
      : req.params.resumeId;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!resumeId || !uuidRegex.test(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID.',
      });
      return;
    }

    const resume = await getOwnedResumeFile(
      resumeId,
      user.userId,
    );

    if (!resume) {
      res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
      return;
    }

    if (resume.mime_type !== 'application/pdf') {
      res.status(415).json({
        success: false,
        message: 'Browser preview is currently supported for PDF files only.',
      });
      return;
    }

    const filePath = getSafeResumeFilePath(resume.file_path);

    if (!filePath) {
      res.status(400).json({
        success: false,
        message: 'Invalid stored file path.',
      });
      return;
    }

    await fs.access(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');

    res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) {
        console.error('Resume preview error:', error);

        res.status(500).json({
          success: false,
          message: 'Unable to preview this resume.',
        });
      }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({
        success: false,
        message: 'Original resume file was not found.',
      });
      return;
    }

    console.error('Resume preview controller error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Unable to preview this resume.',
      });
    }
  }
};

// ==========================================
// DOWNLOAD ORIGINAL RESUME
// ==========================================

export const downloadResumeController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const resumeId = Array.isArray(req.params.resumeId)
      ? req.params.resumeId[0]
      : req.params.resumeId;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!resumeId || !uuidRegex.test(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID.',
      });
      return;
    }

    const resume = await getOwnedResumeFile(
      resumeId,
      user.userId,
    );

    if (!resume) {
      res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
      return;
    }

    const filePath = getSafeResumeFilePath(resume.file_path);

    if (!filePath) {
      res.status(400).json({
        success: false,
        message: 'Invalid stored file path.',
      });
      return;
    }

    const originalFileName =
      resume.original_file_name || 'resume';

    await fs.access(filePath);

    res.setHeader('Cache-Control', 'private, no-store');
    res.download(filePath, originalFileName, (error) => {
      if (error && !res.headersSent) {
        console.error('Resume download error:', error);

        res.status(500).json({
          success: false,
          message: 'Unable to download this resume.',
        });
      }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({
        success: false,
        message: 'Original resume file was not found.',
      });
      return;
    }

    console.error('Resume download controller error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Unable to download this resume.',
      });
    }
  }
};

// ==========================================
// RENAME RESUME
// ==========================================

export const renameResumeController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const resumeId = Array.isArray(req.params.resumeId)
      ? req.params.resumeId[0]
      : req.params.resumeId;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!resumeId || !uuidRegex.test(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID.',
      });
      return;
    }

    const { resumeTitle } = req.body as {
      resumeTitle?: unknown;
    };

    if (typeof resumeTitle !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Resume title is required.',
      });
      return;
    }

    const trimmedTitle = resumeTitle.trim();

    if (!trimmedTitle) {
      res.status(400).json({
        success: false,
        message: 'Resume title cannot be empty.',
      });
      return;
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      res.status(400).json({
        success: false,
        message: `Resume title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
      });
      return;
    }

    const result = await pool.query(
      `UPDATE resumes
       SET resume_title = $1
       WHERE resume_id = $2
       AND user_id = $3
       RETURNING
         resume_id,
         resume_title,
         original_file_name,
         upload_date`,
      [trimmedTitle, resumeId, user.userId],
    );

    const updatedResume = result.rows[0];

    if (!updatedResume) {
      res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Resume renamed successfully.',
      resume: {
        resumeId: updatedResume.resume_id,
        resumeTitle: updatedResume.resume_title,
        originalFileName: updatedResume.original_file_name,
        uploadDate: updatedResume.upload_date,
      },
    });
  } catch (error) {
    console.error('Rename resume error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to rename this resume.',
    });
  }
};

// ==========================================
// DELETE RESUME
// ==========================================

export const deleteResumeController: RequestHandler = async (
  req,
  res,
) => {
  const client = await pool.connect();

  let storedFilePath: string | null = null;
  let transactionStarted = false;

  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const resumeId = Array.isArray(req.params.resumeId)
      ? req.params.resumeId[0]
      : req.params.resumeId;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!resumeId || !uuidRegex.test(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID.',
      });
      return;
    }

    await client.query('BEGIN');
    transactionStarted = true;

    // Find the resume and verify ownership.
    const resumeResult = await client.query<{
      resume_id: string;
      file_path: string;
    }>(
      `SELECT resume_id, file_path
       FROM resumes
       WHERE resume_id = $1
       AND user_id = $2
       FOR UPDATE`,
      [resumeId, user.userId],
    );

    const resume = resumeResult.rows[0];

    if (!resume) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
      return;
    }

    storedFilePath = getSafeResumeFilePath(resume.file_path);

    if (!storedFilePath) {
      throw new Error('Invalid stored resume file path.');
    }

    // Delete the database record.
    // Existing foreign-key cascade rules handle related records.
    await client.query(
      `DELETE FROM resumes
       WHERE resume_id = $1
       AND user_id = $2`,
      [resumeId, user.userId],
    );

    await client.query('COMMIT');
    transactionStarted = false;

    // Remove the original file after the database transaction succeeds.
    try {
      await fs.unlink(storedFilePath);
    } catch (fileError) {
      const error = fileError as NodeJS.ErrnoException;

      if (error.code !== 'ENOENT') {
        console.error(
          'Resume record deleted, but original file cleanup failed:',
          fileError,
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.',
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Resume deletion rollback failed:', rollbackError);
      }
    }

    console.error('Delete resume error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to delete this resume. Please try again.',
    });
  } finally {
    client.release();
  }
};