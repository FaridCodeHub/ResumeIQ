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