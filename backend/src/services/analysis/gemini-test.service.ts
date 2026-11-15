import {
  createGeminiClient,
  GEMINI_MODEL,
} from '../../config/gemini.js';

export async function testGeminiConnection(
  apiKey?: string,
  model?: string
): Promise<string> {
  const gemini = createGeminiClient(apiKey);

  const response = await gemini.models.generateContent({
    model: model || GEMINI_MODEL,
    contents: 'Reply with exactly: ResumeIQ Gemini connection successful.',
  });

  const result = response.text?.trim();

  if (!result) {
    throw new Error('Gemini returned an empty response.');
  }

  return result;
}