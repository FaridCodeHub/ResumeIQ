import { pool } from '../../config/db.js';

import { encryptApiKey } from './api-key-encryption.service.js';

export interface UserAISettingsInput {
  apiKey: string;
  model?: string | null;
}

export interface UserAISettingsStatus {
  configured: boolean;
  provider: 'gemini' | null;
  model: string | null;
  keySource: 'user' | 'platform';
}

export async function saveUserAISettings(
  userId: string,
  input: UserAISettingsInput
): Promise<void> {
  const apiKey = input.apiKey.trim();

  if (!apiKey) {
    throw new Error('Gemini API key cannot be empty.');
  }

  const model = input.model?.trim() || null;

  const encrypted = encryptApiKey(apiKey);

  await pool.query(
    `
      INSERT INTO user_ai_settings (
        user_id,
        provider,
        api_key_ciphertext,
        api_key_iv,
        api_key_auth_tag,
        model,
        updated_at
      )
      VALUES ($1, 'gemini', $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        provider = 'gemini',
        api_key_ciphertext = EXCLUDED.api_key_ciphertext,
        api_key_iv = EXCLUDED.api_key_iv,
        api_key_auth_tag = EXCLUDED.api_key_auth_tag,
        model = EXCLUDED.model,
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      userId,
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
      model,
    ]
  );
}

export async function getUserAISettingsStatus(
  userId: string
): Promise<UserAISettingsStatus> {
  const result = await pool.query(
    `
      SELECT provider, model
      FROM user_ai_settings
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  if (result.rows.length > 0) {
    return {
      configured: true,
      provider: 'gemini',
      model: result.rows[0].model,
      keySource: 'user',
    };
  }

  return {
    configured: false,
    provider: null,
    model: null,
    keySource: 'platform',
  };
}

export async function deleteUserAISettings(
  userId: string
): Promise<void> {
  await pool.query(
    `
      DELETE FROM user_ai_settings
      WHERE user_id = $1
    `,
    [userId]
  );
}