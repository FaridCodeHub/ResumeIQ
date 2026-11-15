BEGIN;

-- Store why a skill was sent for manual review.
ALTER TABLE skill_catalog_review
ADD COLUMN review_reason VARCHAR(30) NOT NULL DEFAULT 'not_found';

-- Store possible canonical skill matches.
ALTER TABLE skill_catalog_review
ADD COLUMN possible_matches TEXT[] NOT NULL DEFAULT '{}';

-- Store evidence extracted from the resume.
ALTER TABLE skill_catalog_review
ADD COLUMN evidence TEXT;

-- Ensure only supported review reasons are stored.
ALTER TABLE skill_catalog_review
ADD CONSTRAINT chk_skill_review_reason
CHECK (
    review_reason IN (
        'not_found',
        'ambiguous',
        'low_confidence'
    )
);

-- Index for filtering review records by reason.
CREATE INDEX idx_skill_review_reason
ON skill_catalog_review(review_reason);

COMMIT;