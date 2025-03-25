WITH 

  -- Get reporting period dates
  reporting_period AS {{#364-default-reporting-period}},

  -- Get the max available date from `gh_issue_history`
  max_history_date AS (
    SELECT MAX(d_effective) AS max_date FROM gh_issue_history
  ),

  -- Generate a list of all dates in the reporting period, but stop at the last available history date
  date_series AS (
    SELECT generate_series(
      (SELECT start_date FROM reporting_period),
      LEAST((SELECT end_date FROM reporting_period), (SELECT max_date FROM max_history_date)),
      INTERVAL '1 day'
    )::DATE AS issue_day
  ),

  -- Deduplicate issue records per day, ensuring each issue_id is counted once per day based on its latest status
  daily_unique_status AS (
    SELECT 
        h.d_effective AS issue_day,
        h.issue_id,
        h.status
    FROM gh_issue_history h
    GROUP BY h.d_effective, h.issue_id, h.status
  ),

  -- Count issues for each status per day
  daily_status_counts AS (
    SELECT 
      dus.issue_day,
      dus.status,
      COUNT(dus.issue_id) AS issue_count
    FROM daily_unique_status dus
    GROUP BY dus.issue_day, dus.status
  )

-- Pivot the status values into separate columns
SELECT 
  dsc.issue_day,
  COALESCE(SUM(CASE WHEN dsc.status = 'Backlog' THEN dsc.issue_count END), 0) AS backlog_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'Blocked' THEN dsc.issue_count END), 0) AS blocked_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'Done' THEN dsc.issue_count END), 0) AS done_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'Icebox' THEN dsc.issue_count END), 0) AS icebox_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'In Progress' THEN dsc.issue_count END), 0) AS in_progress_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'In Review' THEN dsc.issue_count END), 0) AS in_review_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'Planning' THEN dsc.issue_count END), 0) AS planning_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'Prioritized' THEN dsc.issue_count END), 0) AS prioritized_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'Todo' THEN dsc.issue_count END), 0) AS todo_count
FROM 
  daily_status_counts dsc
GROUP BY dsc.issue_day
ORDER BY dsc.issue_day;
