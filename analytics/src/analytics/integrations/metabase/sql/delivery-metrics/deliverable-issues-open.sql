WITH RECURSIVE 

  -- Get epics within a given deliverable
  epics_in_deliverable AS (
    SELECT DISTINCT
      gh_deliverable.id AS deliverable_id,
      e.id AS epic_id,
      e.ghid AS epic_ghid,
      e.title AS epic_title
    FROM
      gh_deliverable
    INNER JOIN gh_epic_deliverable_map m ON m.deliverable_id = gh_deliverable.id
    INNER JOIN gh_epic e ON m.epic_id = e.id 
    WHERE
      {{deliverable_title}}
  ),
 
  -- Get issues within each epic or directly linked to the deliverable
  issue_hierarchy AS (
    -- Issues that are direct children of an epic
    SELECT
      e.deliverable_id,
      e.epic_id,
      e.epic_ghid,
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      EXISTS (SELECT 1 FROM gh_epic WHERE gh_epic.ghid = i.ghid) AS is_epic  -- Identify if this issue is actually an epic
    FROM
      epics_in_deliverable e
    INNER JOIN gh_issue i ON i.parent_issue_ghid = e.epic_ghid

    UNION ALL

    -- Issues that are direct children of the deliverable itself
    SELECT
      gh_deliverable.id AS deliverable_id,
      NULL AS epic_id,
      NULL AS epic_ghid,
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      EXISTS (SELECT 1 FROM gh_epic WHERE gh_epic.ghid = i.ghid) AS is_epic
    FROM
      gh_deliverable
    INNER JOIN gh_issue i ON i.parent_issue_ghid = gh_deliverable.ghid
    WHERE
      {{deliverable_title}}

    UNION ALL
    
    -- Recursively find the children of each issue
    SELECT
      ih.deliverable_id,
      ih.epic_id,
      ih.epic_ghid,
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      EXISTS (SELECT 1 FROM gh_epic WHERE gh_epic.ghid = i.ghid) AS is_epic
    FROM
      gh_issue i
    INNER JOIN issue_hierarchy ih ON i.parent_issue_ghid = ih.issue_ghid
  ),

  -- Assign a numerical priority to statuses based on importance (Lower value = Higher priority)
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

  -- Find the max d_effective per issue
  latest_history AS (
    SELECT 
      gh_issue_history.issue_id,
      MAX(gh_issue_history.d_effective) AS latest_d_effective
    FROM gh_issue_history
    INNER JOIN issue_hierarchy ON gh_issue_history.issue_id = issue_hierarchy.issue_id
    GROUP BY gh_issue_history.issue_id
  ),

  -- Sum points only for the most recent `d_effective`
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

  -- Determine if an issue is pointed or not (based only on latest history)
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

  -- Determine the highest-priority status per issue 
  ranked_issues AS (
    SELECT 
      gh_issue_history.issue_id,
      issue_hierarchy.issue_ghid,
      issue_hierarchy.issue_title,
      gh_issue_history.d_effective,
      gh_issue_history.status,
      ranked_statuses.status_priority,
      issue_hierarchy.is_epic,  -- Preserve epic identification
      ROW_NUMBER() OVER (
        PARTITION BY gh_issue_history.issue_id 
        ORDER BY ranked_statuses.status_priority DESC  
      ) AS rn
    FROM 
      gh_issue_history
    INNER JOIN issue_hierarchy ON gh_issue_history.issue_id = issue_hierarchy.issue_id
    INNER JOIN ranked_statuses ON gh_issue_history.status = ranked_statuses.status  
    INNER JOIN latest_history 
      ON gh_issue_history.issue_id = latest_history.issue_id 
      AND gh_issue_history.d_effective = latest_history.latest_d_effective
  )

-- Select only the highest-priority status per issue and apply pointed logic  
SELECT
  ranked_issues.issue_title,
  ranked_issues.status,
  ranked_issues.issue_ghid,
  CONCAT('http://github.com/', ranked_issues.issue_ghid) AS issue_url,
  issue_pointed_state.pointed,  
  latest_points.total_points AS points,  
  ranked_issues.d_effective,
  ranked_issues.issue_id
FROM
  ranked_issues
INNER JOIN issue_pointed_state ON ranked_issues.issue_id = issue_pointed_state.issue_id 
INNER JOIN latest_points ON ranked_issues.issue_id = latest_points.issue_id  
WHERE
  ranked_issues.rn = 1  -- Keeps only the highest-priority status per issue
  AND ranked_issues.status != 'Done'  -- Exclude completed issues
  AND NOT ranked_issues.is_epic  
ORDER BY
  ranked_issues.issue_title;
