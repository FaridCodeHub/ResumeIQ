BEGIN;

-- Store an audit trail of administrator actions.
CREATE TABLE admin_audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Administrator who performed the action.
    admin_user_id UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    -- Type of action performed.
    action VARCHAR(50) NOT NULL,

    -- Type and ID of the affected entity.
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,

    -- Data before and after the operation.
    old_values JSONB,
    new_values JSONB,

    -- Optional additional information.
    description TEXT,

    -- Record when the action occurred.
    created_at TIMESTAMPTZ
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Validate supported actions.
    CONSTRAINT chk_admin_audit_action
    CHECK (
        action IN (
            'skill_created',
            'skill_updated',
            'skill_activated',
            'skill_deactivated',
            'skill_alias_added',
            'review_approved',
            'review_mapped',
            'review_rejected'
        )
    ),

    -- Validate supported entity types.
    CONSTRAINT chk_admin_audit_entity
    CHECK (
        entity_type IN (
            'skill',
            'skill_review'
        )
    )
);

-- Find audit records by administrator.
CREATE INDEX idx_admin_audit_admin_user
ON admin_audit_logs(admin_user_id);

-- Find audit records for a specific entity.
CREATE INDEX idx_admin_audit_entity
ON admin_audit_logs(entity_type, entity_id);

-- Retrieve recent audit records efficiently.
CREATE INDEX idx_admin_audit_created_at
ON admin_audit_logs(created_at DESC);

-- Filter audit records by action.
CREATE INDEX idx_admin_audit_action
ON admin_audit_logs(action);

COMMIT;