CREATE TABLE IF NOT EXISTS focus_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    task_id BIGINT,
    tree_type VARCHAR(40),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    interrupted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_focus_sessions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_focus_sessions_task
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id
    ON focus_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id
    ON focus_sessions (task_id);
