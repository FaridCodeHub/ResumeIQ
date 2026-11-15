// ==========================================
// RESUME TEXT PREPROCESSING SERVICE
// ==========================================

export class TextPreprocessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TextPreprocessingError';
  }
}

// ==========================================
// TYPES
// ==========================================

export interface PreprocessedResume {
  originalText: string;
  normalizedText: string;
  wordCount: number;
  characterCount: number;
  lines: string[];
}

// ==========================================
// NORMALIZE RESUME TEXT
// ==========================================

export function normalizeResumeText(text: string): string {
  if (typeof text !== 'string' || !text.trim()) {
    throw new TextPreprocessingError(
      'Resume text cannot be empty.',
    );
  }

  let normalizedText = text;

  // Normalize Windows and old Mac line endings.
  normalizedText = normalizedText.replace(/\r\n?/g, '\n');

  // Remove null bytes and unwanted control characters.
  normalizedText = normalizedText.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    '',
  );

  // Normalize common Unicode spaces.
  normalizedText = normalizedText.replace(
    /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g,
    ' ',
  );

  // Remove zero-width and byte-order-mark characters.
  normalizedText = normalizedText.replace(
    /[\u200B-\u200D\uFEFF]/g,
    '',
  );

  // Remove spaces at the beginning and end of each line.
  normalizedText = normalizedText
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');

  // Reduce excessive blank lines while preserving paragraphs.
  normalizedText = normalizedText.replace(/\n{3,}/g, '\n\n');

  // Remove spaces around line breaks.
  normalizedText = normalizedText.replace(/ *\n */g, '\n');

  return normalizedText.trim();
}

// ==========================================
// COUNT WORDS
// ==========================================

function countWords(text: string): number {
  const words = text.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’+#.-]*\b/gu);

  return words?.length ?? 0;
}

// ==========================================
// PREPROCESS RESUME
// ==========================================

export function preprocessResumeText(
  extractedText: string,
): PreprocessedResume {
  if (typeof extractedText !== 'string' || !extractedText.trim()) {
    throw new TextPreprocessingError(
      'No extracted resume text was provided.',
    );
  }

  const normalizedText = normalizeResumeText(extractedText);

  const lines = normalizedText
    .split('\n')
    .filter((line) => line.trim().length > 0);

  const wordCount = countWords(normalizedText);

  if (wordCount < 10) {
    throw new TextPreprocessingError(
      'The resume contains too little readable text for analysis.',
    );
  }

  return {
    originalText: extractedText,
    normalizedText,
    wordCount,
    characterCount: normalizedText.length,
    lines,
  };
}

/*

### Function Responsibilities

#### 1. `normalizeResumeText()`
- Cleans extracted resume text.
- Removes unnecessary whitespace and special characters.
- Standardizes text formatting.

#### 2. `countWords()`
- Counts the total number of readable words.
- Returns the word count of the processed text.

#### 3. `preprocessResumeText()`
- Executes the resume text preprocessing steps.
- Combines text normalization and word counting.
- Returns structured, analysis-ready data.
```
*/