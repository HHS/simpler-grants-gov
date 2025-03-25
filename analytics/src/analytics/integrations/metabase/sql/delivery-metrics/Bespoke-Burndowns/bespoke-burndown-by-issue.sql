WITH RECURSIVE 

  -- constants 
  constants AS (
    SELECT 
        'HHS/simpler-grants-gov/issues/XXXX' AS deliverable_ghid
  ),

  -- Get reporting period dynamically
  reporting_period AS {{#364-default-reporting-period}},

  -- Fetch deliverable title separately
  deliverable_info AS (
    SELECT 
      id AS deliverable_id,
      title AS deliverable_title
    FROM 
      gh_deliverable
    WHERE 
      ghid = (SELECT deliverable_ghid FROM constants)
  ),

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
      gh_deliverable.ghid = (SELECT deliverable_ghid FROM constants)
  ),

  -- Get issues within each epic or directly linked to the deliverable
  issue_hierarchy AS (
    -- Issues that are direct children of an epic (existing logic)
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

    -- Issues that are direct children of the deliverable itself (new logic)
    SELECT
      d.deliverable_id,
      NULL AS epic_id,  -- No epic, directly linked to deliverable
      NULL AS root_epic_ghid,
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid
    FROM 
      deliverable_info d
    INNER JOIN gh_issue i ON i.parent_issue_ghid = (SELECT deliverable_ghid FROM constants)

    UNION ALL

    -- Recursively find children of all issues, whether they originate from an epic or deliverable
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

  -- Calculate issues opened in the given time period 
  opened AS (
    SELECT
      h.d_effective AS issue_day,
      COUNT(DISTINCT h.issue_id) AS total_opened
    FROM 
      gh_issue_history h
    INNER JOIN issue_hierarchy ih ON h.issue_id = ih.issue_id
    CROSS JOIN reporting_period
    WHERE
      h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
    GROUP BY h.d_effective
    ORDER BY h.d_effective
  ),
  
  -- Calculate issues closed in the given time period 
  closed AS (
    SELECT
      h.d_effective AS issue_day,
      COUNT(DISTINCT h.issue_id) AS total_closed
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
  
  -- Aggregate issues opened and closed by day 
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
  )

SELECT
  (SELECT deliverable_title FROM deliverable_info) AS deliverable_title,
  issue_day,
  total_opened,
  total_closed,
  total_remaining
FROM totals;
