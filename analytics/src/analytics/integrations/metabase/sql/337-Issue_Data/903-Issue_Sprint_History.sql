WITH issue_history AS
  (SELECT h.d_effective,
          h.sprint_id,
          h.issue_id
   FROM gh_issue_history AS h
   INNER JOIN gh_issue ON gh_issue.id = h.issue_id
   WHERE {{ghid}}
   ORDER BY h.issue_id,
            h.d_effective ASC), -- Add previous sprint_id using LAG() to detect transitions
-- LAG() gets the sprint_id from the previous row (ordered by date) for the same issue
history_with_previous AS
  (SELECT d_effective,
          sprint_id,
          issue_id,
          LAG(sprint_id) OVER (PARTITION BY issue_id
                               ORDER BY d_effective ASC) AS previous_sprint_id
   FROM issue_history), -- Filter to only rows where sprint_id changed (or is the first row for an issue)
-- IS DISTINCT FROM handles NULL comparisons correctly
transition_dates AS
  (SELECT d_effective,
          sprint_id,
          issue_id
   FROM history_with_previous
   WHERE -- Include first occurrence (no previous sprint_id)
 previous_sprint_id IS NULL -- OR include when sprint_id actually changed

     OR sprint_id IS DISTINCT
     FROM previous_sprint_id) -- Join with sprint details and return results

SELECT t.d_effective,
       t.sprint_id,
       gh_sprint.name AS sprint_name,
       gh_sprint.start_date,
       gh_sprint.end_date
FROM transition_dates t
INNER JOIN gh_sprint ON gh_sprint.id = t.sprint_id
ORDER BY t.d_effective DESC