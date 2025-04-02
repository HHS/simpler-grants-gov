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
      e.epic_ghid AS root_epic_ghid,
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      EXISTS (SELECT 1 FROM gh_epic WHERE gh_epic.ghid = i.ghid) AS is_epic,  -- Identify epics
      EXISTS (SELECT 1 FROM gh_deliverable WHERE gh_deliverable.ghid = i.ghid) AS is_deliverable  -- Identify deliverables
    FROM 
      epics_in_deliverable e
    INNER JOIN gh_issue i ON i.parent_issue_ghid = e.epic_ghid

    UNION ALL

    -- Issues that are direct children of the deliverable itself
    SELECT
      gh_deliverable.id AS deliverable_id,
      NULL AS epic_id,
      NULL AS root_epic_ghid,
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      EXISTS (SELECT 1 FROM gh_epic WHERE gh_epic.ghid = i.ghid) AS is_epic,
      EXISTS (SELECT 1 FROM gh_deliverable WHERE gh_deliverable.ghid = i.ghid) AS is_deliverable
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
      ih.root_epic_ghid,
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      EXISTS (SELECT 1 FROM gh_epic WHERE gh_epic.ghid = i.ghid) AS is_epic,
      EXISTS (SELECT 1 FROM gh_deliverable WHERE gh_deliverable.ghid = i.ghid) AS is_deliverable
    FROM 
      gh_issue i
    INNER JOIN issue_hierarchy ih ON i.parent_issue_ghid = ih.issue_ghid
  ),

  -- Get most recent d_effective per issue
  latest_issue_date AS (
    SELECT
      h.issue_id,
      MAX(h.d_effective) AS max_d_effective
    FROM 
      gh_issue_history h
    INNER JOIN issue_hierarchy i ON h.issue_id = i.issue_id
    WHERE 
      NOT i.is_epic  -- Exclude epics
      AND NOT i.is_deliverable  -- Exclude deliverables
    GROUP BY h.issue_id
  ),

  -- Determine if an issue has points on its most recent history record 
  issue_state AS (
    SELECT
      i.issue_id,
      CASE 
        WHEN SUM(h.points) > 0 THEN 'pointed' 
        ELSE 'unpointed' 
      END AS issue_state
    FROM 
      gh_issue_history h
    INNER JOIN issue_hierarchy i ON h.issue_id = i.issue_id
    INNER JOIN latest_issue_date ld 
      ON h.issue_id = ld.issue_id 
      AND h.d_effective = ld.max_d_effective
    WHERE 
      NOT i.is_epic  -- Exclude epics
      AND NOT i.is_deliverable  -- Exclude deliverables
      AND h.status != 'Done'  -- Filter out "Done" tasks
    GROUP BY i.issue_id
  )

-- Count issues per category (pointed vs. unpointed)
SELECT
  issue_state,
  COUNT(*) AS issue_count
FROM 
  issue_state
GROUP BY issue_state
ORDER BY issue_state;
