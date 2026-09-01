WITH issue_history AS
  (SELECT h.d_effective,
          h.status,
          h.issue_id
   FROM gh_issue_history AS h
   INNER JOIN gh_issue ON gh_issue.id = h.issue_id
   WHERE {{ghid}}
   ORDER BY h.issue_id,
            h.d_effective ASC), -- Add previous status using LAG() to detect transitions
-- LAG() gets the status from the previous row (ordered by date) for the same issue
history_with_previous AS
  (SELECT d_effective,
          status,
          issue_id,
          LAG(status) OVER (PARTITION BY issue_id
                            ORDER BY d_effective ASC) AS previous_status
   FROM issue_history), -- Filter to only rows where status changed (or is the first row for an issue)
-- IS DISTINCT FROM handles NULL comparisons correctly
transition_dates AS
  (SELECT d_effective,
          status,
          issue_id
   FROM history_with_previous
   WHERE previous_status IS NULL -- Include first occurrence (no previous status)

     OR status IS DISTINCT -- Include when status actually changed

     FROM previous_status) -- Return transition dates with status

SELECT t.d_effective,
       t.status
FROM transition_dates t
ORDER BY t.d_effective DESC