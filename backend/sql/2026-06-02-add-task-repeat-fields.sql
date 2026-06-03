ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS preferred_time VARCHAR(20);

CREATE TABLE IF NOT EXISTS task_repeat_days (
    task_id BIGINT NOT NULL,
    repeat_day VARCHAR(20) NOT NULL,
    PRIMARY KEY (task_id, repeat_day),
    CONSTRAINT fk_task_repeat_days_task
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
