CREATE TABLE IF NOT EXISTS trees (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    focus_session_id BIGINT UNIQUE,
    species VARCHAR(100) NOT NULL,
    tree_type VARCHAR(40) NOT NULL,
    growth_stage INTEGER NOT NULL,
    growth_progress INTEGER NOT NULL DEFAULT 0,
    damaged BOOLEAN NOT NULL DEFAULT FALSE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_trees_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_trees_focus_session
        FOREIGN KEY (focus_session_id) REFERENCES focus_sessions (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_trees_user_id
    ON trees (user_id);
