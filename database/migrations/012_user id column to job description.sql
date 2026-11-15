-- Add ownership to job descriptions.
-- NULL user_id identifies system-provided jobs.

ALTER TABLE job_descriptions
ADD COLUMN user_id UUID;

ALTER TABLE job_descriptions
ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'public';

-- Only public and private visibility are allowed.
ALTER TABLE job_descriptions
ADD CONSTRAINT chk_job_descriptions_visibility
CHECK (visibility IN ('private', 'public'));

-- System-provided jobs must remain public.
ALTER TABLE job_descriptions
ADD CONSTRAINT chk_system_jobs_public
CHECK (user_id IS NOT NULL OR visibility = 'public');

-- A user's jobs cannot outlive their account.
-- RESTRICT prevents accidental cascading deletion.
ALTER TABLE job_descriptions
ADD CONSTRAINT fk_job_descriptions_user
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON DELETE RESTRICT;

-- Improve filtering and sorting.
CREATE INDEX idx_job_descriptions_user_created
ON job_descriptions(user_id, created_at DESC);

CREATE INDEX idx_job_descriptions_visibility_created
ON job_descriptions(visibility, created_at DESC);

-- Preserve analysis history when a job is deleted.
ALTER TABLE analysis
DROP CONSTRAINT analysis_job_id_fkey;

ALTER TABLE analysis
ADD CONSTRAINT analysis_job_id_fkey
FOREIGN KEY (job_id)
REFERENCES job_descriptions(job_id)
ON DELETE RESTRICT;