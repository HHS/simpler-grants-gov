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

  -- Determine pointed vs. unpointed status for each issue_id per day
  daily_issue_states AS (
    SELECT 
        h.d_effective AS issue_day,
        h.issue_id,
        CASE 
            WHEN SUM(CASE WHEN h.points > 0 THEN 1 ELSE 0 END) > 0 THEN 'pointed'
            ELSE 'unpointed'
        END AS issue_state
    FROM gh_issue_history h
    GROUP BY h.d_effective, h.issue_id
  )

-- Calculate daily sum of pointed and unpointed issues
SELECT 
  ds.issue_day,
  COUNT(CASE WHEN dis.issue_state = 'unpointed' THEN 1 END) AS zero_points_count,
  COUNT(CASE WHEN dis.issue_state = 'pointed' THEN 1 END) AS nonzero_points_count
FROM 
  date_series ds
LEFT JOIN daily_issue_states dis 
  ON ds.issue_day = dis.issue_day
GROUP BY ds.issue_day
ORDER BY ds.issue_day;
