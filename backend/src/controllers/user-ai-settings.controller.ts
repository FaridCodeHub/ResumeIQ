import type { Request, Response } from 'express';
import { z } from 'zod';

import {
  saveUserAISettings,
  getUserAISettingsStatus,
  deleteUserAISettings,
} from '../services/analysis/user-ai-settings.service.js';

import {
  testGeminiConnection,
} from '../services/analysis/gemini-test.service.js';

const saveSettingsSchema = z.object({
  apiKey: z.string().trim().min(1).max(500),
  model: z.string().trim().max(120).optional(),
});

const testSettingsSchema = z.object({
  apiKey: z.string().trim().min(1).max(500),
  model: z.string().trim().max(120).optional(),
});

function getUserId(res: Response): string {
  const userId = res.locals.authUser?.userId;

  if (!userId) {
    throw new Error('Authenticated user not found.');
  }

  return userId;
}

export async function getAISettingsController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = getUserId(res);

    const settings = await getUserAISettingsStatus(userId);

    res.status(200).json({
      success: true,
      settings,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve AI settings.',
    });
  }
}

export async function saveAISettingsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = saveSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid AI settings.',
        errors: validation.error.issues,
      });
      return;
    }

    const userId = getUserId(res);

    await saveUserAISettings(userId, validation.data);

    res.status(200).json({
      success: true,
      message: 'Gemini API settings saved successfully.',
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to save AI settings.',
    });
  }
}

export async function testAISettingsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = testSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid API key or model.',
        errors: validation.error.issues,
      });
      return;
    }

    const { apiKey, model } = validation.data;

    await testGeminiConnection(apiKey, model);

    res.status(200).json({
      success: true,
      message: 'Gemini connection successful.',
    });
  } catch {
    res.status(400).json({
      success: false,
      message: 'Gemini connection failed. Check your API key and model.',
    });
  }
}

export async function deleteAISettingsController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = getUserId(res);

    await deleteUserAISettings(userId);

    res.status(200).json({
      success: true,
      message: 'Personal Gemini API settings removed successfully.',
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to remove AI settings.',
    });
  }
}