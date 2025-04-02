WITH RECURSIVE

-- Step 1: Resolve the selected deliverable
selected_deliverable AS (
  SELECT id, ghid
  FROM gh_deliverable
  WHERE 
  {{deliverable_title}}
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

-- Step 8: Assign numerical priorities to statuses
ranked_statuses AS (
  SELECT 'Icebox' AS status, 1 AS status_priority UNION ALL
  SELECT 'Backlog', 2 UNION ALL
  SELECT 'Prioritized', 3 UNION ALL
  SELECT 'Planning', 4 UNION ALL
  SELECT 'Todo', 5 UNION ALL
  SELECT 'Blocked', 6 UNION ALL
  SELECT 'In Progress', 7 UNION ALL
  SELECT 'In Review', 8 UNION ALL
  SELECT 'Done', 9
),

-- Step 9: Latest state per issue
latest_history AS (
  SELECT 
    h.issue_id,
    MAX(h.d_effective) AS latest_d_effective
  FROM gh_issue_history h
  JOIN combined_issues ci ON h.issue_id = ci.issue_id
  GROUP BY h.issue_id
),

-- Step 10: Points from most recent record
latest_points AS (
  SELECT 
    h.issue_id,
    SUM(h.points) AS total_points
  FROM gh_issue_history h
  JOIN latest_history lh ON h.issue_id = lh.issue_id AND h.d_effective = lh.latest_d_effective
  GROUP BY h.issue_id
),

-- Step 11: Mark pointed state
issue_pointed_state AS (
  SELECT 
    h.issue_id,
    CASE WHEN SUM(h.points) > 0 THEN '√' ELSE NULL END AS pointed
  FROM gh_issue_history h
  JOIN latest_history lh ON h.issue_id = lh.issue_id AND h.d_effective = lh.latest_d_effective
  GROUP BY h.issue_id
),

-- Step 12: Rank current issue status
ranked_issues AS (
  SELECT 
    h.issue_id,
    ci.issue_ghid,
    ci.issue_title,
    h.d_effective,
    h.status,
    rs.status_priority,
    ROW_NUMBER() OVER (
      PARTITION BY h.issue_id 
      ORDER BY rs.status_priority DESC
    ) AS rn
  FROM gh_issue_history h
  JOIN latest_history lh ON h.issue_id = lh.issue_id AND h.d_effective = lh.latest_d_effective
  JOIN combined_issues ci ON h.issue_id = ci.issue_id
  JOIN ranked_statuses rs ON h.status = rs.status
)

-- Final output
SELECT
  ri.issue_title,
  ri.status,
  ri.issue_ghid,
  CONCAT('http://github.com/', ri.issue_ghid) AS issue_url,
  ips.pointed,
  lp.total_points AS points,
  ri.d_effective,
  ri.issue_id
FROM ranked_issues ri
JOIN issue_pointed_state ips ON ri.issue_id = ips.issue_id
JOIN latest_points lp ON ri.issue_id = lp.issue_id
WHERE ri.rn = 1
  AND ri.status != 'Done'
ORDER BY ri.issue_title;
