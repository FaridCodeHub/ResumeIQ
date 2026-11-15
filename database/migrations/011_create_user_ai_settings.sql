BEGIN;

CREATE TABLE IF NOT EXISTS user_ai_settings (
    user_id UUID PRIMARY KEY
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    provider VARCHAR(30) NOT NULL DEFAULT 'gemini',

    api_key_ciphertext TEXT NOT NULL,
    api_key_iv VARCHAR(32) NOT NULL,
    api_key_auth_tag VARCHAR(32) NOT NULL,

    model VARCHAR(120),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_ai_provider
        CHECK (provider = 'gemini')
);

CREATE INDEX IF NOT EXISTS idx_user_ai_settings_updated_at
ON user_ai_settings(updated_at DESC);

COMMIT;