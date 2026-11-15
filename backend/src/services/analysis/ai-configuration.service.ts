import { pool } from '../../config/db.js';

import {
  decryptApiKey,
} from './api-key-encryption.service.js';

import {
  GEMINI_MODEL,
} from '../../config/gemini.js';

import type {
  AIConfiguration,
} from './analysis.types.js';

/**
 * Resolves the Gemini configuration for an authenticated user.
 *
 * Priority:
 * 1. User's saved Gemini API key.
 * 2. Platform Gemini API key.
 *
 * Model priority:
 * 1. User's saved model.
 * 2. Platform default model.
 */
export async function resolveAIConfiguration(
  userId: string
): Promise<AIConfiguration> {
  if (!userId) {
    throw new Error('User ID is required to resolve AI configuration.');
  }

  // Check whether the user has saved a personal API key.
  const result = await pool.query(
    `
      SELECT
        api_key_ciphertext,
        api_key_iv,
        api_key_auth_tag,
        model
      FROM user_ai_settings
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  const userSettings = result.rows[0];

  // Use the user's personal API key when available.
  if (userSettings) {
    const apiKey = decryptApiKey({
      ciphertext: userSettings.api_key_ciphertext,
      iv: userSettings.api_key_iv,
      authTag: userSettings.api_key_auth_tag,
    });

    return {
      provider: 'gemini',
      apiKey,
      model: userSettings.model || GEMINI_MODEL,
      source: 'user',
    };
  }

  // Otherwise, use the platform API key.
  const platformApiKey = process.env.GEMINI_API_KEY;

  if (!platformApiKey) {
    throw new Error(
      'No Gemini API key is configured. Please add your personal API key or contact the platform administrator.'
    );
  }

  return {
    provider: 'gemini',
    apiKey: platformApiKey,
    model: GEMINI_MODEL,
    source: 'platform',
  };
}