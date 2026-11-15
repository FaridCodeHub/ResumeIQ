import type { Request, Response } from 'express';
import { z } from 'zod';

import {
  executeResumeAnalysis,
  AnalysisServiceError,
} from '../services/analysis/analysis-orchestrator.service.js';

import type {
  ResumeAnalysisRequest,
} from '../services/analysis/analysis.types.js';

// ==================================================
// REQUEST VALIDATION
// ==================================================

const generalAnalysisSchema = z.object({
  resumeId: z.string().uuid(),
});

const jobSpecificAnalysisSchema = z.object({
  resumeId: z.string().uuid(),
  jobId: z.string().uuid(),
});

// ==================================================
// AUTHENTICATED USER
// ==================================================

function getAuthenticatedUserId(
  res: Response,
): string | null {
  return res.locals.authUser?.userId ?? null;
}

// ==================================================
// GENERAL RESUME ANALYSIS
// ==================================================

export async function createGeneralAnalysisController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const validation = generalAnalysisSchema.safeParse(
      req.body,
    );

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid analysis request.',
        errors: validation.error.issues,
      });
      return;
    }

    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const request: ResumeAnalysisRequest = {
      analysisType: 'general',
      resumeId: validation.data.resumeId,
    };

    const result = await executeResumeAnalysis(
      userId,
      request,
    );

    res.status(201).json({
      success: true,
      message: 'Resume analysis completed successfully.',
      data: result,
    });
  } catch (error) {
    handleAnalysisError(error, res);
  }
}

// ==================================================
// JOB-SPECIFIC RESUME ANALYSIS
// ==================================================

export async function createJobSpecificAnalysisController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const validation = jobSpecificAnalysisSchema.safeParse(
      req.body,
    );

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid job-specific analysis request.',
        errors: validation.error.issues,
      });
      return;
    }

    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const request: ResumeAnalysisRequest = {
      analysisType: 'job_specific',
      resumeId: validation.data.resumeId,
      jobId: validation.data.jobId,
    };

    const result = await executeResumeAnalysis(
      userId,
      request,
    );

    res.status(201).json({
      success: true,
      message: 'Job-specific resume analysis completed successfully.',
      data: result,
    });
  } catch (error) {
    handleAnalysisError(error, res);
  }
}

// ==================================================
// ERROR HANDLING
// ==================================================

function handleAnalysisError(
  error: unknown,
  res: Response,
): void {
  if (error instanceof AnalysisServiceError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error('Resume analysis controller error:', error);

  res.status(500).json({
    success: false,
    message: 'Unable to complete resume analysis. Please try again.',
  });
}