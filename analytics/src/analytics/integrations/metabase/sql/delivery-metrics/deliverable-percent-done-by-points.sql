WITH RECURSIVE 

-- Step 1: Resolve the selected deliverable
selected_deliverable AS (
  SELECT id, ghid
  FROM gh_deliverable
  WHERE {{deliverable_title}}
),

-- Step 2: Latest epic-to-deliverable mappings only
latest_epic_mappings AS (
  SELECT DISTINCT ON (edm.epic_id)
    edm.epic_id,
    e.ghid AS epic_ghid,
    edm.deliverable_id,
    edm.d_effective
  FROM gh_epic_deliverable_map edm
  JOIN gh_epic e ON edm.epic_id = e.id
  ORDER BY edm.epic_id, edm.d_effective DESC
),

-- Step 3: Epics currently mapped to the selected deliverable
epics_in_deliverable AS (
  SELECT
    lem.epic_id,
    lem.epic_ghid,
    lem.deliverable_id
  FROM latest_epic_mappings lem
  JOIN selected_deliverable sd ON lem.deliverable_id = sd.id
),

-- Step 4: Recursively walk the issue tree from epics
epic_issue_tree AS (
  SELECT
    e.deliverable_id,
    e.epic_id,
    e.epic_ghid,
    i.id AS issue_id,
    i.ghid AS issue_ghid,
    i.title AS issue_title,
    i.parent_issue_ghid
  FROM epics_in_deliverable e
  JOIN gh_issue i ON i.parent_issue_ghid = e.epic_ghid

  UNION ALL

  SELECT
    eit.deliverable_id,
    eit.epic_id,
    eit.epic_ghid,
    i.id AS issue_id,
    i.ghid AS issue_ghid,
    i.title AS issue_title,
    i.parent_issue_ghid
  FROM gh_issue i
  JOIN epic_issue_tree eit ON i.parent_issue_ghid = eit.issue_ghid
),

-- Step 5: Pre-filter issues that are direct children of the deliverable
raw_direct_issues AS (
  SELECT
    sd.id AS deliverable_id,
    i.id AS issue_id,
    i.ghid AS issue_ghid,
    i.title AS issue_title,
    i.parent_issue_ghid
  FROM selected_deliverable sd
  JOIN gh_issue i ON i.parent_issue_ghid = sd.ghid
),

-- Step 6: Filter out issues that are actually epics mapped elsewhere
direct_issues AS (
  SELECT
    rdi.deliverable_id,
    NULL::integer AS epic_id,
    NULL::text AS epic_ghid,
    rdi.issue_id,
    rdi.issue_ghid,
    rdi.issue_title,
    rdi.parent_issue_ghid
  FROM raw_direct_issues rdi
  WHERE NOT EXISTS (
    SELECT 1
    FROM latest_epic_mappings lem
    JOIN gh_epic ep ON lem.epic_id = ep.id
    WHERE ep.ghid = rdi.issue_ghid
  )
),

-- Step 7: Combine both sources
combined_issues AS (
  SELECT * FROM epic_issue_tree
  UNION ALL
  SELECT * FROM direct_issues
),

-- Step 8: Latest snapshot per issue
latest_history AS (
  SELECT 
    h.issue_id,
    MAX(h.d_effective) AS latest_d_effective
  FROM gh_issue_history h
  JOIN combined_issues ci ON h.issue_id = ci.issue_id
  GROUP BY h.issue_id
),

-- Step 9: Pull point data from latest state
issue_points AS (
  SELECT
    h.issue_id,
    h.points,
    CASE WHEN h.is_closed = 1 THEN h.points ELSE 0 END AS points_closed,
    CASE WHEN h.is_closed = 0 THEN h.points ELSE 0 END AS points_open
  FROM gh_issue_history h
  JOIN latest_history lh ON h.issue_id = lh.issue_id AND h.d_effective = lh.latest_d_effective
)

-- Final calculation
SELECT
  SUM(points_open) AS points_open,
  SUM(points_closed) AS points_closed,
  SUM(points) AS total_points,
  CASE
    WHEN SUM(points) = 0 THEN '0%'
    ELSE CONCAT(CEIL(100 * (SUM(points_closed)::DECIMAL / NULLIF(SUM(points), 0))), '%')
  END AS percent_complete,
  COUNT(*) AS total_issues
FROM issue_points;
