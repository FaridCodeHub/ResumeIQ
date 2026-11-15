BEGIN;

-- Administrator who reviewed the suggestion.
ALTER TABLE skill_catalog_review
ADD COLUMN reviewed_by UUID
REFERENCES users(user_id)
ON DELETE SET NULL;

-- Canonical skill selected during review.
ALTER TABLE skill_catalog_review
ADD COLUMN mapped_skill_id UUID
REFERENCES skills(skill_id)
ON DELETE SET NULL;

-- Record the administrator's decision.
ALTER TABLE skill_catalog_review
ADD COLUMN decision VARCHAR(30);

-- Optional explanation for the decision.
ALTER TABLE skill_catalog_review
ADD COLUMN review_notes TEXT;

-- Record the last review update.
ALTER TABLE skill_catalog_review
ADD COLUMN updated_at TIMESTAMPTZ
NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Validate decisions.
ALTER TABLE skill_catalog_review
ADD CONSTRAINT chk_skill_review_decision
CHECK (
    decision IS NULL
    OR decision IN (
        'approved_new',
        'mapped_existing',
        'rejected'
    )
);

-- Ensure decision and status remain consistent.
ALTER TABLE skill_catalog_review
ADD CONSTRAINT chk_skill_review_decision_status
CHECK (
    (
        status = 'pending'
        AND decision IS NULL
        AND mapped_skill_id IS NULL
    )
    OR
    (
        status = 'approved'
        AND decision = 'approved_new'
        AND mapped_skill_id IS NULL
    )
    OR
    (
        status = 'approved'
        AND decision = 'mapped_existing'
        AND mapped_skill_id IS NOT NULL
    )
    OR
    (
        status = 'rejected'
        AND decision = 'rejected'
    )
);

CREATE INDEX idx_skill_review_mapped_skill
ON skill_catalog_review(mapped_skill_id);

CREATE INDEX idx_skill_review_reviewed_by
ON skill_catalog_review(reviewed_by);

COMMIT;