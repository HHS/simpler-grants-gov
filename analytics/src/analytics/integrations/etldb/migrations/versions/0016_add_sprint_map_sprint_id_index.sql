-- gh_issue_sprint_map has no index covering sprint_id, forcing a full
-- table scan to resolve which issues belong to a given sprint.
CREATE INDEX IF NOT EXISTS gh_ism_i1 ON gh_issue_sprint_map(sprint_id, issue_id);
