-- Precomputed per-quad deliverable ranking, current-state and independent
-- of any reporting period. Lets deliverable-ranking queries read a ranked
-- deliverable list directly instead of recomputing the window
-- function/anti-join over the full history tables on every query.

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_deliverables_per_quad AS
WITH quad AS (
  SELECT id AS quad_id, name AS quad_name, ghid AS quad_ghid, start_date, end_date
  FROM gh_quad
),
quad_deliverable_map AS (
  SELECT *
  FROM (
    SELECT quad_id, deliverable_id, d_effective,
           ROW_NUMBER() OVER (PARTITION BY deliverable_id ORDER BY d_effective DESC) AS ranked_order
    FROM gh_deliverable_quad_map
  ) history
  WHERE history.ranked_order = 1
),
all_deliverables AS (
  SELECT d.id AS deliverable_id, d.title AS deliverable_title, d.ghid AS deliverable_ghid
  FROM gh_deliverable d
  WHERE NOT EXISTS (SELECT 1 FROM gh_epic e WHERE e.ghid = d.ghid AND e.t_modified > d.t_modified)
    AND NOT EXISTS (SELECT 1 FROM gh_issue i WHERE i.ghid = d.ghid AND i.t_modified > d.t_modified)
)
SELECT q.quad_id, q.quad_name, q.quad_ghid,
       d.deliverable_id, d.deliverable_title, d.deliverable_ghid,
       qdm.d_effective,
       ROW_NUMBER() OVER (PARTITION BY q.quad_id ORDER BY d.deliverable_title) AS ranked_order
FROM quad q
JOIN quad_deliverable_map qdm ON q.quad_id = qdm.quad_id
JOIN all_deliverables d ON qdm.deliverable_id = d.deliverable_id;

-- Each deliverable is mapped to exactly one (its latest) quad, so
-- deliverable_id alone is unique -- required for REFRESH ... CONCURRENTLY.
CREATE UNIQUE INDEX IF NOT EXISTS mv_dpq_i1 ON mv_deliverables_per_quad (deliverable_id);

-- Precomputed latest epic-to-deliverable mapping, one row per epic holding
-- its most recent mapping by d_effective. Lets burndowns queries join
-- directly instead of recomputing a DISTINCT ON over the full mapping
-- history on every query.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_latest_epic_deliverable_map AS
SELECT DISTINCT ON (edm.epic_id) edm.epic_id, e.ghid AS epic_ghid, edm.deliverable_id, edm.d_effective
FROM gh_epic_deliverable_map edm
JOIN gh_epic e ON edm.epic_id = e.id
ORDER BY edm.epic_id, edm.d_effective DESC;

CREATE UNIQUE INDEX IF NOT EXISTS mv_ledm_i1 ON mv_latest_epic_deliverable_map (epic_id);

-- Precomputed deliverable-to-issue membership (epic tree walk plus direct
-- children) joined against gh_issue_history and pre-aggregated by
-- (deliverable_id, day). Lets burndowns queries employ a single indexed
-- range scan instead of a recursive tree walk and full history join.

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_deliverable_daily_burndown AS
WITH RECURSIVE
epics_in_deliverable AS (
  SELECT lem.epic_id, lem.epic_ghid, lem.deliverable_id
  FROM mv_latest_epic_deliverable_map lem
),
epic_issue_tree AS (
  SELECT e.deliverable_id, i.id AS issue_id, i.ghid AS issue_ghid
  FROM epics_in_deliverable e
  JOIN gh_issue i ON i.parent_issue_ghid = e.epic_ghid
  UNION ALL
  SELECT eit.deliverable_id, i.id AS issue_id, i.ghid AS issue_ghid
  FROM gh_issue i
  JOIN epic_issue_tree eit ON i.parent_issue_ghid = eit.issue_ghid
),
direct_issues AS (
  SELECT d.id AS deliverable_id, i.id AS issue_id
  FROM gh_deliverable d
  JOIN gh_issue i ON i.parent_issue_ghid = d.ghid
  WHERE NOT EXISTS (
    SELECT 1
    FROM mv_latest_epic_deliverable_map lem
    JOIN gh_epic ep ON lem.epic_id = ep.id
    WHERE ep.ghid = i.ghid
  )
),
deliverable_issue_map AS (
  SELECT deliverable_id, issue_id FROM epic_issue_tree
  UNION ALL
  SELECT deliverable_id, issue_id FROM direct_issues
)
SELECT dim.deliverable_id,
       h.d_effective AS issue_day,
       COUNT(DISTINCT h.issue_id) AS total_issues_opened,
       COUNT(DISTINCT h.issue_id) FILTER (WHERE h.is_closed::BOOLEAN) AS total_issues_closed,
       COALESCE(SUM(h.points), 0) AS total_points_opened,
       COALESCE(SUM(h.points) FILTER (WHERE h.is_closed::BOOLEAN), 0) AS total_points_closed
FROM deliverable_issue_map dim
JOIN gh_issue_history h ON h.issue_id = dim.issue_id
GROUP BY dim.deliverable_id, h.d_effective;

CREATE UNIQUE INDEX IF NOT EXISTS mv_ddb_i1 ON mv_deliverable_daily_burndown (deliverable_id, issue_day);
