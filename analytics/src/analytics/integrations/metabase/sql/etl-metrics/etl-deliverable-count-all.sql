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
  )

-- Count deliverables for each day in the valid reporting period
SELECT 
  ds.deliverable_day,
  COUNT(dh.id) AS deliverable_count
FROM 
  date_series ds
LEFT JOIN gh_deliverable_history dh 
  ON ds.deliverable_day = dh.d_effective
GROUP BY ds.deliverable_day
ORDER BY ds.deliverable_day;
