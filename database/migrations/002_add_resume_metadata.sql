-- Migration 002: Add metadata fields to resumes

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255);

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS extracted_text TEXT;