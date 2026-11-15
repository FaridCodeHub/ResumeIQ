BEGIN;

-- Allow general resume analysis without a job description.
ALTER TABLE analysis
ALTER COLUMN job_id DROP NOT NULL;

-- Identify the type of analysis.
ALTER TABLE analysis
ADD COLUMN analysis_type VARCHAR(20)
NOT NULL DEFAULT 'job_specific';

-- Ensure only valid analysis types and job ID combinations exist.
ALTER TABLE analysis
ADD CONSTRAINT chk_analysis_type_job_id
CHECK (
    (analysis_type = 'general' AND job_id IS NULL)
    OR
    (analysis_type = 'job_specific' AND job_id IS NOT NULL)
);

-- Improve filtering by analysis type.
CREATE INDEX idx_analysis_type
ON analysis (analysis_type);

COMMIT;