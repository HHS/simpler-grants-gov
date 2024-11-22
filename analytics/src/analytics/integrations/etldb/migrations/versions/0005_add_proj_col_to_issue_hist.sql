ALTER TABLE IF EXISTS gh_issue_history ADD COLUMN IF NOT EXISTS project_id INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS gh_issue_history ADD COLUMN IF NOT EXISTS sprint_id INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS gh_issue_history DROP CONSTRAINT IF EXISTS gh_issue_history_issue_id_d_effective_key;
ALTER TABLE IF EXISTS gh_issue_history ADD UNIQUE (issue_id, project_id, d_effective);

