WITH 

  -- Step 1: Find all orphan issues (those with NULL parent_issue_ghid and are NOT epics or deliverables)
  orphan_issues AS (
    SELECT 
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid
    FROM gh_issue i
    LEFT JOIN gh_epic e ON i.ghid = e.ghid  -- Exclude epics
    LEFT JOIN gh_deliverable d ON i.ghid = d.ghid  -- Exclude deliverables
    WHERE i.parent_issue_ghid IS NULL  
      AND e.ghid IS NULL  -- Ensure issue is NOT an epic
      AND d.ghid IS NULL  -- Ensure issue is NOT a deliverable
  ),

  -- Step 2: Assign a numerical priority to statuses (lower value = higher priority)
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

  -- Step 3: Find the most recent history snapshot per issue
  latest_history AS (
    SELECT 
      gh_issue_history.issue_id,
      MAX(gh_issue_history.d_effective) AS latest_d_effective
    FROM gh_issue_history
    INNER JOIN orphan_issues ON gh_issue_history.issue_id = orphan_issues.issue_id
    GROUP BY gh_issue_history.issue_id
  ),

  -- Step 4: Sum points only for the most recent `d_effective`
  latest_points AS (
    SELECT 
      gh_issue_history.issue_id,
      SUM(gh_issue_history.points) AS total_points
    FROM gh_issue_history
    INNER JOIN latest_history 
      ON gh_issue_history.issue_id = latest_history.issue_id 
      AND gh_issue_history.d_effective = latest_history.latest_d_effective
    GROUP BY gh_issue_history.issue_id
  ),

  -- Step 5: Determine if an issue is pointed or not
  issue_pointed_state AS (
    SELECT 
      gh_issue_history.issue_id,
      CASE 
        WHEN SUM(gh_issue_history.points) > 0 THEN '√'  
        ELSE NULL  
      END AS pointed
    FROM gh_issue_history
    INNER JOIN latest_history 
      ON gh_issue_history.issue_id = latest_history.issue_id 
      AND gh_issue_history.d_effective = latest_history.latest_d_effective
    GROUP BY gh_issue_history.issue_id
  ),

  -- Step 6: Determine the highest-priority status per issue
  ranked_issues AS (
    SELECT 
      gh_issue_history.issue_id,
      orphan_issues.issue_ghid,
      orphan_issues.issue_title,
      orphan_issues.parent_issue_ghid,
      gh_issue_history.d_effective,
      gh_issue_history.status,
      ranked_statuses.status_priority,
      ROW_NUMBER() OVER (
        PARTITION BY gh_issue_history.issue_id 
        ORDER BY ranked_statuses.status_priority DESC  
      ) AS rn
    FROM 
      gh_issue_history
    INNER JOIN orphan_issues ON gh_issue_history.issue_id = orphan_issues.issue_id
    INNER JOIN ranked_statuses ON gh_issue_history.status = ranked_statuses.status  
    INNER JOIN latest_history 
      ON gh_issue_history.issue_id = latest_history.issue_id 
      AND gh_issue_history.d_effective = latest_history.latest_d_effective
  )

-- Step 7: Final selection with parent issue GHID for debugging
SELECT DISTINCT
  ri.issue_title,
  ri.status,
  ri.issue_ghid,
  ri.parent_issue_ghid, 
  CONCAT('http://github.com/', ri.issue_ghid) AS issue_url,
  COALESCE(ips.pointed, '') AS pointed,  
  COALESCE(lp.total_points, 0) AS points,  
  ri.d_effective,
  ri.issue_id
FROM ranked_issues ri
LEFT JOIN issue_pointed_state ips ON ri.issue_id = ips.issue_id 
LEFT JOIN latest_points lp ON ri.issue_id = lp.issue_id  
WHERE
  ri.rn = 1  -- Keep only the highest-priority status per issue
  AND ri.status != 'Done'  -- Exclude completed issues
ORDER BY ri.issue_title;
