WITH RECURSIVE 

  -- Get all deliverables 
  deliverable_state AS {{#200-all-deliverables-titles-excluding-done}},

  -- Get epics within each deliverable
  epics_in_deliverable AS (
    SELECT DISTINCT
      deliverable_state.deliverable_id,
      deliverable_state.title AS deliverable_title,
      e.id AS epic_id,
      e.ghid AS epic_ghid,
      e.title AS epic_title
    FROM 
      deliverable_state
    INNER JOIN gh_epic_deliverable_map m ON m.deliverable_id = deliverable_state.deliverable_id
    INNER JOIN gh_epic e ON m.epic_id = e.id 
  ),

  -- Recursive issue hierarchy, including direct-to-deliverable issues
  issue_hierarchy AS (
    -- Issues that are direct children of an epic
    SELECT
      e.deliverable_id,
      e.deliverable_title,
      e.epic_id,
      e.epic_ghid AS root_epic_ghid, 
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      EXISTS (SELECT 1 FROM gh_epic WHERE gh_epic.ghid = i.ghid) AS is_epic,  
      EXISTS (SELECT 1 FROM gh_deliverable WHERE gh_deliverable.ghid = i.ghid) AS is_deliverable  
    FROM 
      epics_in_deliverable e
    INNER JOIN gh_issue i ON i.parent_issue_ghid = e.epic_ghid

    UNION ALL

    -- Issues that are direct children of the deliverable
    SELECT
      ds.deliverable_id,  
      ds.title AS deliverable_title,
      NULL AS epic_id,
      NULL AS root_epic_ghid, 
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      EXISTS (SELECT 1 FROM gh_epic WHERE gh_epic.ghid = i.ghid) AS is_epic,
      EXISTS (SELECT 1 FROM gh_deliverable WHERE gh_deliverable.ghid = i.ghid) AS is_deliverable
    FROM 
      deliverable_state ds
    INNER JOIN gh_issue i ON i.parent_issue_ghid = ds.ghid

    UNION ALL
    
    -- Recursively find the children of each issue
    SELECT
      ih.deliverable_id,
      ih.deliverable_title,
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

  -- Find the max d_effective per issue
  latest_issue_date AS (
    SELECT
      gh_issue_history.issue_id,
      MAX(gh_issue_history.d_effective) AS max_d_effective
    FROM 
      gh_issue_history
    INNER JOIN issue_hierarchy ON gh_issue_history.issue_id = issue_hierarchy.issue_id
    GROUP BY gh_issue_history.issue_id
  ),

  -- Aggregate issue status for the max d_effective per issue (excluding epics & deliverables)
  issue_state AS (
    SELECT
      issue_hierarchy.deliverable_id,
      issue_hierarchy.deliverable_title,
      gh_issue_history.issue_id,
      gh_issue_history.d_effective,
      MAX(CASE WHEN gh_issue_history.is_closed::BOOLEAN = TRUE THEN 1 ELSE 0 END) AS is_closed
    FROM 
      gh_issue_history
    INNER JOIN issue_hierarchy ON gh_issue_history.issue_id = issue_hierarchy.issue_id
    INNER JOIN latest_issue_date ON 
      gh_issue_history.issue_id = latest_issue_date.issue_id
      AND gh_issue_history.d_effective = latest_issue_date.max_d_effective
    WHERE 
      NOT issue_hierarchy.is_epic  -- Ensure we exclude epics
      AND NOT issue_hierarchy.is_deliverable  -- Ensure we exclude deliverables
    GROUP BY 
      issue_hierarchy.deliverable_id,
      issue_hierarchy.deliverable_title,
      gh_issue_history.issue_id,
      gh_issue_history.d_effective
  ),

  -- Count open and closed issues per deliverable
  subtotals AS (
    SELECT
      deliverable_id,
      deliverable_title,
      SUM(CASE WHEN is_closed = 0 THEN 1 ELSE 0 END) AS issues_open,
      SUM(CASE WHEN is_closed = 1 THEN 1 ELSE 0 END) AS issues_closed,
      COUNT(*) AS total_issues
    FROM
      issue_state
    GROUP BY deliverable_id, deliverable_title
  ),

  -- Calculate percent complete per deliverable
  total AS (
    SELECT
      deliverable_id,
      deliverable_title,
      CASE 
        WHEN SUM(total_issues) = 0 THEN '0%'
        ELSE CONCAT(CEIL(100 * (SUM(issues_closed) / NULLIF(SUM(total_issues)::DECIMAL, 0))), '%')
      END AS percent_complete
    FROM
      subtotals
    GROUP BY deliverable_id, deliverable_title
  )

-- Final output: Percent complete for each deliverable
SELECT
  subtotals.deliverable_id,
  subtotals.deliverable_title,
  subtotals.issues_open,
  subtotals.issues_closed,
  subtotals.total_issues,
  total.percent_complete
FROM
  subtotals
JOIN total ON subtotals.deliverable_id = total.deliverable_id
ORDER BY subtotals.deliverable_title;
