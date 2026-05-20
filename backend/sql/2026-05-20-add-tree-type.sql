ALTER TABLE trees
ADD COLUMN IF NOT EXISTS tree_type VARCHAR(40);

UPDATE trees
SET tree_type = 'MAPLE'
WHERE tree_type IS NULL;
