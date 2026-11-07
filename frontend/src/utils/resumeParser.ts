import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });

    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');

      pages.push(pageText);
    }

    return pages.join('\n\n').trim();
  }

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    return result.value.trim();
  }

  throw new Error('Unsupported file type. Upload a PDF or DOCX file.');
}