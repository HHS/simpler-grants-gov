WITH 

  -- Get reporting period dates
  reporting_period AS {{#364-default-reporting-period}},

  -- Get the max available date from `gh_deliverable_history`
  max_history_date AS (
    SELECT MAX(d_effective) AS max_date FROM gh_deliverable_history
  ),

  -- Generate a list of all dates in the reporting period, but stop at the last available history date
  date_series AS (
    SELECT generate_series(
      (SELECT start_date FROM reporting_period),
      LEAST((SELECT end_date FROM reporting_period), (SELECT max_date FROM max_history_date)),
      INTERVAL '1 day'
    )::DATE AS deliverable_day
  ),

  -- Count deliverables for each status per day (filtering only specific statuses)
  daily_status_counts AS (
    SELECT 
      ds.deliverable_day,
      dh.status,
      COUNT(dh.id) AS deliverable_count
    FROM 
      date_series ds
    LEFT JOIN gh_deliverable_history dh 
      ON ds.deliverable_day = dh.d_effective
    WHERE dh.status IN ('Backlog', 'Done', 'In Progress', 'Planning')
    GROUP BY ds.deliverable_day, dh.status
  )

-- Pivot the status values into separate columns
SELECT 
  dsc.deliverable_day,
  COALESCE(SUM(CASE WHEN dsc.status = 'Backlog' THEN dsc.deliverable_count END), 0) AS backlog_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'Done' THEN dsc.deliverable_count END), 0) AS done_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'In Progress' THEN dsc.deliverable_count END), 0) AS in_progress_count,
  COALESCE(SUM(CASE WHEN dsc.status = 'Planning' THEN dsc.deliverable_count END), 0) AS planning_count
FROM 
  daily_status_counts dsc
GROUP BY dsc.deliverable_day
ORDER BY dsc.deliverable_day;
