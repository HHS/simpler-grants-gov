WITH RECURSIVE 

  -- Get reporting period dynamically
  reporting_period AS {{#364-default-reporting-period}},
  
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
      i.parent_issue_ghid
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
      i.parent_issue_ghid
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
      i.parent_issue_ghid
    FROM 
      gh_issue i
    INNER JOIN issue_hierarchy ih ON i.parent_issue_ghid = ih.issue_ghid
  ),

  -- Calculate points opened in the given time period
  opened AS (
    SELECT
      h.d_effective AS issue_day,
      SUM(h.points) AS total_opened
    FROM 
      gh_issue_history h
    INNER JOIN issue_hierarchy ih ON h.issue_id = ih.issue_id
    CROSS JOIN reporting_period
    WHERE
      h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
    GROUP BY h.d_effective
    ORDER BY h.d_effective
  ),
  
  -- Calculate points closed in the given time period
  closed AS (
    SELECT
      h.d_effective AS issue_day,
      SUM(h.points) AS total_closed
    FROM 
      gh_issue_history h
    INNER JOIN issue_hierarchy ih ON h.issue_id = ih.issue_id
    CROSS JOIN reporting_period
    WHERE
      h.is_closed::BOOLEAN = TRUE
      AND h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
    GROUP BY h.d_effective
    ORDER BY h.d_effective
  ),
  
  -- Aggregate points opened and closed by day 
  totals AS (
    SELECT
      COALESCE(opened.issue_day, closed.issue_day) AS issue_day,
      COALESCE(opened.total_opened, 0) AS total_opened,
      COALESCE(closed.total_closed, 0) AS total_closed,
      COALESCE(opened.total_opened, 0) - COALESCE(closed.total_closed, 0) AS total_remaining
    FROM
      opened
    FULL OUTER JOIN closed 
      ON opened.issue_day = closed.issue_day
    ORDER BY issue_day
  )
  
SELECT
  *
FROM
  totals;
