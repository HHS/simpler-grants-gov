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
  )

-- Calculate daily sum of points and count of records with points = 0 and > 0
SELECT 
  ds.issue_day,
  COALESCE(SUM(h.points), 0) AS total_points
FROM 
  date_series ds
LEFT JOIN gh_issue_history h 
  ON ds.issue_day = h.d_effective
GROUP BY ds.issue_day
ORDER BY ds.issue_day;
