import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

export function createGeminiClient(apiKey?: string): GoogleGenAI {
  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (!resolvedApiKey) {
    throw new Error(
      'No Gemini API key configured. Add a personal API key or configure the platform API key.'
    );
  }

  return new GoogleGenAI({
    apiKey: resolvedApiKey,
  });
}