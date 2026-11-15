import type { Request, Response } from 'express';

import {
  getAnalysisHistory,
} from '../services/analysis/analysis-history.service.js';

export async function getAnalysisHistoryController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = res.locals.authUser?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const pageValue = req.query.page;
    const limitValue = req.query.limit;

    const page = pageValue === undefined
      ? 1
      : Number(pageValue);

    const limit = limitValue === undefined
      ? 10
      : Number(limitValue);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1
    ) {
      res.status(400).json({
        success: false,
        message: 'Page and limit must be positive integers.',
      });
      return;
    }

    const result = await getAnalysisHistory(
      userId,
      page,
      limit,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Analysis history controller error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve analysis history.',
    });
  }
}

/*
## Analysis History API

- ✅ Reads the authenticated user's ID.
- ✅ Validates pagination parameters.
- ✅ Calls the history service.
- ✅ Returns the analysis history as JSON.
- ✅ Prevents access to another user's analysis records.
*/