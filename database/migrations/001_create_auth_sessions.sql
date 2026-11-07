CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    refresh_token_hash CHAR(64) NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ DEFAULT NULL,

    last_used_at TIMESTAMPTZ DEFAULT NULL,

    user_agent TEXT DEFAULT NULL,

    ip_address INET DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
    ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
    ON auth_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_active
    ON auth_sessions(user_id, expires_at)
    WHERE revoked_at IS NULL;