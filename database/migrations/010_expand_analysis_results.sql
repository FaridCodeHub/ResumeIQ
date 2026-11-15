BEGIN;

-- ==========================================
-- 1. EXPAND ANALYSIS TABLE
-- ==========================================

ALTER TABLE analysis
ADD COLUMN IF NOT EXISTS overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS result_json JSONB,
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(30),
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(120),
ADD COLUMN IF NOT EXISTS ai_key_source VARCHAR(20),
ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER,
ADD COLUMN IF NOT EXISTS request_duration_ms INTEGER;

ALTER TABLE analysis
ADD CONSTRAINT chk_analysis_overall_score
CHECK (overall_score >= 0 AND overall_score <= 100);

ALTER TABLE analysis
ADD CONSTRAINT chk_analysis_confidence_score
CHECK (confidence_score >= 0 AND confidence_score <= 100);

ALTER TABLE analysis
ADD CONSTRAINT chk_analysis_ai_key_source
CHECK (
    ai_key_source IS NULL
    OR ai_key_source IN ('user', 'platform')
);


-- ==========================================
-- 2. EXPAND ATS ANALYSIS
-- ==========================================

ALTER TABLE ats_analysis
ADD COLUMN IF NOT EXISTS structure_score NUMERIC(5,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS scoring_breakdown JSONB;

ALTER TABLE ats_analysis
ADD CONSTRAINT chk_ats_structure_score
CHECK (structure_score >= 0 AND structure_score <= 100);


-- ==========================================
-- 3. EXPAND RECOMMENDATIONS
-- ==========================================

ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS recommendation_title VARCHAR(250),
ADD COLUMN IF NOT EXISTS category VARCHAR(30),
ADD COLUMN IF NOT EXISTS example TEXT;

ALTER TABLE recommendations
ADD CONSTRAINT chk_recommendation_category
CHECK (
    category IS NULL
    OR category IN (
        'content',
        'formatting',
        'skills',
        'experience',
        'education',
        'ats',
        'other'
    )
);


-- ==========================================
-- 4. EXPAND CAREER RECOMMENDATIONS
-- ==========================================

ALTER TABLE career_recommendations
ADD COLUMN IF NOT EXISTS reasoning TEXT,
ADD COLUMN IF NOT EXISTS required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb;


-- ==========================================
-- 5. EXPAND SKILL GAPS
-- ==========================================

ALTER TABLE skill_gaps
ADD COLUMN IF NOT EXISTS learning_recommendation TEXT;


-- ==========================================
-- 6. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_analysis_user_date
ON analysis (user_id, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_resume_date
ON analysis (resume_id, analysis_date DESC);


COMMIT;