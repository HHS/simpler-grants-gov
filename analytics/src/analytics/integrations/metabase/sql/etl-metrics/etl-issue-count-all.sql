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

  -- Deduplicate issue records per day by counting each issue only once
  daily_unique_issues AS (
    SELECT 
        h.d_effective AS issue_day,
        h.issue_id
    FROM gh_issue_history h
    GROUP BY h.d_effective, h.issue_id
  )

-- Count unique issues per day in the valid reporting period
SELECT 
  ds.issue_day,
  COUNT(dis.issue_id) AS issue_count
FROM 
  date_series ds
LEFT JOIN daily_unique_issues dis 
  ON ds.issue_day = dis.issue_day
GROUP BY ds.issue_day
ORDER BY ds.issue_day;
