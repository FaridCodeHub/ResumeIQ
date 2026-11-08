import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export class ResumeExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeExtractionError';
  }
}

export interface ExtractedResume {
  text: string;
  pageCount: number | null;
}

export async function extractResumeText(
  filePath: string,
  mimeType: string,
): Promise<ExtractedResume> {
  const extension = path.extname(filePath).toLowerCase();

  try {
    let text = '';
    let pageCount: number | null = null;

    if (
      mimeType === 'application/pdf' &&
      extension === '.pdf'
    ) {
      const fileBuffer = await fs.readFile(filePath);

      const parser = new PDFParse({
        data: new Uint8Array(fileBuffer),
      });

      try {
        const result = await parser.getText();

        text = result.text;
        pageCount = result.total;
      } finally {
        await parser.destroy();
      }
    } else if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      extension === '.docx'
    ) {
      const result = await mammoth.extractRawText({
        path: filePath,
      });

      text = result.value;
    } else {
      throw new ResumeExtractionError(
        'Unsupported resume format. Please upload a PDF or DOCX file.',
      );
    }

    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanedText) {
      throw new ResumeExtractionError(
        'No readable text was found. Scanned PDFs may require OCR.',
      );
    }

    return {
      text: cleanedText,
      pageCount,
    };
  } catch (error) {
    if (error instanceof ResumeExtractionError) {
      throw error;
    }

    console.error('Resume text extraction error:', error);

    throw new ResumeExtractionError(
      'Unable to extract text from this resume. Please check that the file is valid and try again.',
    );
  }
}