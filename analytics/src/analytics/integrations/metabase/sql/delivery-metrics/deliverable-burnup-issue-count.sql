WITH RECURSIVE

  -- 1. Get reporting period dynamically
  reporting_period AS (
    {{#364-default-reporting-period}}
  ),

  -- 2. Resolve the selected deliverable
  selected_deliverable AS (
    SELECT id, ghid
    FROM gh_deliverable
    WHERE {{deliverable_title}}
  ),

  -- 3. Latest epic-to-deliverable mappings only
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

  -- 4. Epics currently mapped to the selected deliverable
  epics_in_deliverable AS (
    SELECT
      lem.epic_id,
      lem.epic_ghid,
      lem.deliverable_id
    FROM latest_epic_mappings lem
    JOIN selected_deliverable sd ON lem.deliverable_id = sd.id
  ),

  -- 5. Recursively traverse the issue tree starting from epics
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

  -- 6. Pre-filter issues that are direct children of the deliverable
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

  -- 7. Filter out issues that are actually epics mapped elsewhere
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

  -- 8. Combine both epic-based issues and direct deliverable issues
  combined_issues AS (
    SELECT * FROM epic_issue_tree
    UNION ALL
    SELECT * FROM direct_issues
  ),

  -- 9. Calculate issues opened in the given time period
  opened AS (
    SELECT
      h.d_effective AS issue_day,
      COUNT(DISTINCT h.issue_id) AS total_opened
    FROM gh_issue_history h
    JOIN combined_issues ci ON h.issue_id = ci.issue_id
    CROSS JOIN reporting_period
    WHERE h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
    GROUP BY h.d_effective
    ORDER BY h.d_effective
  ),

  -- 10. Calculate issues closed in the given time period
  closed AS (
    SELECT
      h.d_effective AS issue_day,
      COUNT(DISTINCT h.issue_id) AS total_closed
    FROM gh_issue_history h
    JOIN combined_issues ci ON h.issue_id = ci.issue_id
    CROSS JOIN reporting_period
    WHERE h.is_closed::BOOLEAN = TRUE
      AND h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
    GROUP BY h.d_effective
    ORDER BY h.d_effective
  ),

  -- 11. Aggregate issues opened and closed by day
  totals AS (
    SELECT
      COALESCE(o.issue_day, c.issue_day) AS issue_day,
      COALESCE(o.total_opened, 0) AS total_opened,
      COALESCE(c.total_closed, 0) AS total_closed,
      COALESCE(o.total_opened, 0) - COALESCE(c.total_closed, 0) AS total_remaining
    FROM opened o
    FULL OUTER JOIN closed c ON o.issue_day = c.issue_day
    ORDER BY issue_day
  )

SELECT *
FROM totals;
