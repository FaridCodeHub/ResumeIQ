BEGIN;

-- Expand the existing skills table.
ALTER TABLE skills
ADD COLUMN description TEXT,
ADD COLUMN normalized_name VARCHAR(150),
ADD COLUMN parent_skill_id UUID,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Self-reference for related or hierarchical skills.
ALTER TABLE skills
ADD CONSTRAINT fk_skills_parent
FOREIGN KEY (parent_skill_id)
REFERENCES skills(skill_id)
ON DELETE SET NULL;

-- Normalize existing skill names.
UPDATE skills
SET normalized_name = LOWER(
    REGEXP_REPLACE(
        TRIM(skill_name),
        '[[:space:]_.-]+',
        '',
        'g'
    )
);

ALTER TABLE skills
ALTER COLUMN normalized_name SET NOT NULL;

-- Prevent duplicate canonical normalized names.
CREATE UNIQUE INDEX idx_skills_normalized_name
ON skills(normalized_name);

-- Search index for active skills.
CREATE INDEX idx_skills_active_category
ON skills(category)
WHERE is_active = TRUE;

-- Alternative names for canonical skills.
CREATE TABLE skill_aliases (
    alias_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    skill_id UUID NOT NULL
        REFERENCES skills(skill_id)
        ON DELETE CASCADE,

    alias_name VARCHAR(150) NOT NULL,

    normalized_alias VARCHAR(150) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_skill_alias_normalized
        UNIQUE(normalized_alias)
);

CREATE INDEX idx_skill_aliases_skill_id
ON skill_aliases(skill_id);

-- Unrecognized skills awaiting review.
CREATE TABLE skill_catalog_review (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    proposed_skill_name VARCHAR(150) NOT NULL,

    normalized_name VARCHAR(150) NOT NULL UNIQUE,

    category VARCHAR(100),

    description TEXT,

    source VARCHAR(50) NOT NULL DEFAULT 'ai',

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    reviewed_at TIMESTAMPTZ,

    CONSTRAINT chk_skill_review_status
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);

CREATE INDEX idx_skill_review_status
ON skill_catalog_review(status);

COMMIT;