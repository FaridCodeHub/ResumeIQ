import type { Request, Response } from 'express';
import { z } from 'zod';

import {
  getAnalysisResult,
  AnalysisNotFoundError,
} from '../services/analysis/analysis-result.service.js';

const analysisIdSchema = z.string().uuid();

export async function getAnalysisResultController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = res.locals.authUser?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
    return;
  }

  const validation = analysisIdSchema.safeParse(req.params.analysisId);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid analysis ID.',
    });
    return;
  }

  try {
    const result = await getAnalysisResult(
      userId,
      validation.data,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AnalysisNotFoundError) {
      res.status(404).json({
        success: false,
        message: 'Analysis not found.',
      });
      return;
    }

    console.error('Get analysis result error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve analysis result.',
    });
  }
}