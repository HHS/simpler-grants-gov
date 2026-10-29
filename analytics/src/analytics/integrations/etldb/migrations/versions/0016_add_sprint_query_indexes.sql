-- Supports looking up which issues belong to a given sprint.
CREATE INDEX IF NOT EXISTS gh_ism_i1 ON gh_issue_sprint_map(sprint_id, issue_id);

-- Supports filtering issue history by sprint.
CREATE INDEX IF NOT EXISTS gh_ih_i2 ON gh_issue_history(sprint_id, d_effective);
