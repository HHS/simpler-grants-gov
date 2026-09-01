WITH deliverable_history AS
  (SELECT h.d_effective,
          h.status,
          h.deliverable_id
   FROM gh_deliverable_history AS h
   INNER JOIN gh_deliverable ON gh_deliverable.id = h.deliverable_id
   WHERE {{deliverable_title}}
   ORDER BY h.deliverable_id,
            h.d_effective ASC), -- Add previous status using LAG() to detect transitions
-- LAG() gets the status from the previous row (ordered by date) for the same deliverable
history_with_previous AS
  (SELECT d_effective,
          status,
          deliverable_id,
          LAG(status) OVER (PARTITION BY deliverable_id
                            ORDER BY d_effective ASC) AS previous_status
   FROM deliverable_history), -- Filter to only rows where status changed (or is the first row for a deliverable)
-- IS DISTINCT FROM handles NULL comparisons correctly
transition_dates AS
  (SELECT d_effective,
          status,
          deliverable_id
   FROM history_with_previous
   WHERE previous_status IS NULL -- Include first occurrence (no previous status)

     OR status IS DISTINCT -- Include when status actually changed

     FROM previous_status) -- Return transition dates with status

SELECT t.d_effective,
       t.status
FROM transition_dates t
ORDER BY t.d_effective ASC