CREATE TABLE IF NOT EXISTS habit_completions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    task_id BIGINT NOT NULL,
    completed_on DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_habit_completion_task_day UNIQUE (task_id, completed_on),
    CONSTRAINT fk_habit_completions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_habit_completions_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
