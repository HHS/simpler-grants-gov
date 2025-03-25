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
      (epic.ghid IS NOT NULL) AS is_epic
    FROM
      epics_in_deliverable e
    INNER JOIN gh_issue i ON i.parent_issue_ghid = e.epic_ghid
    LEFT JOIN gh_epic epic ON epic.ghid = i.ghid

    UNION ALL

    -- Issues that are direct children of the deliverable itself
    SELECT
      ds.deliverable_id,
      ds.title AS deliverable_title,
      NULL AS epic_id,
      NULL AS root_epic_ghid,
      i.id AS issue_id,
      i.ghid AS issue_ghid,
      i.title AS issue_title,
      i.parent_issue_ghid,
      (epic.ghid IS NOT NULL) AS is_epic
    FROM
      deliverable_state ds
    INNER JOIN gh_issue i ON i.parent_issue_ghid = ds.ghid
    LEFT JOIN gh_epic epic ON epic.ghid = i.ghid  -- Identify epics

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
      (epic.ghid IS NOT NULL) AS is_epic
    FROM
      gh_issue i
    INNER JOIN issue_hierarchy ih ON i.parent_issue_ghid = ih.issue_ghid
    LEFT JOIN gh_epic epic ON epic.ghid = i.ghid  -- Identify epics
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

  -- Determine if an issue has points on its most recent history record
  issue_state AS (
    SELECT
      issue_hierarchy.deliverable_id,
      issue_hierarchy.deliverable_title,
      gh_issue_history.issue_id,

      -- Only check points for the most recent effective date
      CASE
        WHEN MAX(gh_issue_history.points) > 0 THEN 1
        ELSE 0
      END AS has_points
    FROM
      gh_issue_history
    INNER JOIN issue_hierarchy ON gh_issue_history.issue_id = issue_hierarchy.issue_id
    INNER JOIN latest_issue_date ON
      gh_issue_history.issue_id = latest_issue_date.issue_id
      AND gh_issue_history.d_effective = latest_issue_date.max_d_effective
    WHERE
      NOT issue_hierarchy.is_epic  -- Use the flag instead of subquery
    GROUP BY issue_hierarchy.deliverable_id, issue_hierarchy.deliverable_title, gh_issue_history.issue_id
  )

-- Calculate percent pointed and percent non-pointed
SELECT
  deliverable_id,
  deliverable_title,
  ROUND(100.0 * COUNT(CASE WHEN has_points = 1 THEN 1 END) / NULLIF(COUNT(*), 0), 1) AS percent_pointed,
  ROUND(100.0 * COUNT(CASE WHEN has_points = 0 THEN 1 END) / NULLIF(COUNT(*), 0), 1) AS percent_non_pointed
FROM
  issue_state
GROUP BY deliverable_id, deliverable_title
ORDER BY deliverable_title;
