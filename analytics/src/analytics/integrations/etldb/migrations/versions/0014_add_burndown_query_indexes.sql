-- gh_issue.parent_issue_ghid drives the recursive epic->issue tree walk used
-- by the Deliverable_Burndowns/Deliverable_Burnup/Deliverable_Data queries;
-- it previously had no index at all, forcing a full table scan per
-- recursion level per query.
CREATE INDEX IF NOT EXISTS gh_issue_i2 ON gh_issue(parent_issue_ghid);

-- gh_deliverable_quad_map/gh_epic_deliverable_map are day-keyed SCD tables;
-- "latest row per deliverable/epic" is resolved via a ROW_NUMBER()/DISTINCT
-- ON ordered (id, d_effective DESC), but the existing indexes on these
-- tables are ascending on d_effective, so that ordering can't be served
-- from an index and falls back to a full sort.
CREATE INDEX IF NOT EXISTS gh_dqm_i2 ON gh_deliverable_quad_map(deliverable_id, d_effective DESC);
CREATE INDEX IF NOT EXISTS gh_edm_i2 ON gh_epic_deliverable_map(epic_id, d_effective DESC);
