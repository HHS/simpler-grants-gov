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

  -- De-duplicate history records and get most recent state for each issue (excluding epics & deliverables)
  issue_state AS (
    SELECT
      history.issue_id,
      history.is_closed::BOOLEAN AS is_closed
    FROM (
      SELECT
        gh_issue_history.issue_id,
        gh_issue_history.is_closed,
        ROW_NUMBER() OVER (
          PARTITION BY gh_issue_history.issue_id 
          ORDER BY gh_issue_history.d_effective DESC
        ) AS ranked_order
      FROM 
        gh_issue_history
      INNER JOIN issue_hierarchy ON gh_issue_history.issue_id = issue_hierarchy.issue_id
      WHERE 
        NOT issue_hierarchy.is_epic  -- Exclude epics
        AND NOT issue_hierarchy.is_deliverable  -- Exclude deliverables
    ) history
    WHERE 
      history.ranked_order = 1
  ),
  
  -- Count open and closed issues
  subtotals AS (
    SELECT
      SUM(CASE WHEN is_closed THEN 0 ELSE 1 END) AS issues_open,
      SUM(CASE WHEN is_closed THEN 1 ELSE 0 END) AS issues_closed,
      COUNT(*) AS total_issues
    FROM
      issue_state
  ),
  
  -- Calculate percent complete
  total AS (
    SELECT
      CONCAT(CEIL(100 * (SUM(issues_closed) / NULLIF(SUM(total_issues)::DECIMAL, 0))), '%') 
      AS percent_complete
    FROM
      subtotals
  )
  
SELECT
  *
FROM
  subtotals,
  total;
