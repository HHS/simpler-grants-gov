-- gh_issue_sprint_map has no index covering sprint_id, forcing a full
-- table scan to resolve which issues belong to a given sprint.
CREATE INDEX IF NOT EXISTS gh_ism_i1 ON gh_issue_sprint_map(sprint_id, issue_id);

-- gh_issue_history has no index covering sprint_id, forcing a full table
-- scan for any query filtering issue history by sprint directly.
CREATE INDEX IF NOT EXISTS gh_ih_i2 ON gh_issue_history(sprint_id, d_effective);
