BEGIN;

-- Ensure canonical skill names are normalized correctly.
ALTER TABLE skills
ADD CONSTRAINT chk_skill_normalized_name
CHECK (
    normalized_name =
    LOWER(
        REGEXP_REPLACE(
            TRIM(skill_name),
            '[[:space:]_.-]+',
            '',
            'g'
        )
    )
);

-- Ensure aliases are normalized correctly.
ALTER TABLE skill_aliases
ADD CONSTRAINT chk_alias_normalized_name
CHECK (
    normalized_alias =
    LOWER(
        REGEXP_REPLACE(
            TRIM(alias_name),
            '[[:space:]_.-]+',
            '',
            'g'
        )
    )
);

-- Prevent a skill from being its own parent.
ALTER TABLE skills
ADD CONSTRAINT chk_skill_not_own_parent
CHECK (
    parent_skill_id IS NULL
    OR parent_skill_id <> skill_id
);

COMMIT;