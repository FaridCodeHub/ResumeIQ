import multer from 'multer';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { Request } from 'express';

const CURRENT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));

const STORAGE_DIRECTORY = path.resolve(
  CURRENT_DIRECTORY,
  '../../storage/resumes',
);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, STORAGE_DIRECTORY);
  },

  filename: (req: Request, file, callback) => {
    const userId = req.res?.locals.authUser?.userId;

    if (!userId) {
      return callback(new Error('Authenticated user not found.'), '');
    }

    const year = new Date().getFullYear();
    const randomId = randomBytes(6).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();

    const generatedFilename =
      `RIQ_${year}_${userId}_${randomId}${extension}`;

    callback(null, generatedFilename);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  const extension = path.extname(file.originalname).toLowerCase();

  const isAllowed =
    ALLOWED_MIME_TYPES.includes(file.mimetype) &&
    ALLOWED_EXTENSIONS.includes(extension);

  if (!isAllowed) {
    return callback(
      new Error('Only PDF and DOCX resume files are allowed.'),
    );
  }

  callback(null, true);
}

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});