WITH -- Constants
 constants AS
  (SELECT 8 AS deliverable_ranked_order), -- Reporting period
 reporting_period AS ({{#restore:Default_Reporting_Period}}), -- Get quad id from selected quad name
 quad AS
  (SELECT id AS quad_id,
          name AS quad_name,
          ghid AS quad_ghid,
          start_date,
          end_date
   FROM gh_quad
   WHERE {{quad}}
   ORDER BY name
   LIMIT 1), -- Get deliverable via quad_id and ranked_order, reading the precomputed
 -- per-quad ranking directly instead of recomputing it
 selected_deliverable AS
  (SELECT deliverable_id,
          deliverable_ghid,
          deliverable_title
   FROM mv_deliverables_per_quad
   WHERE quad_id =
       (SELECT quad_id
        FROM quad)
     AND ranked_order =
       (SELECT deliverable_ranked_order
        FROM constants)), -- Precomputed daily open/closed counts for the selected deliverable,
 -- filtered to the reporting period
 totals AS
  (SELECT b.issue_day,
          b.total_issues_opened AS total_opened,
          b.total_issues_closed AS total_closed,
          b.total_issues_opened - b.total_issues_closed AS total_remaining
   FROM mv_deliverable_daily_burndown b
   JOIN selected_deliverable sd ON b.deliverable_id = sd.deliverable_id
   CROSS JOIN reporting_period
   WHERE b.issue_day BETWEEN reporting_period.start_date AND reporting_period.end_date) -- Final output

SELECT sd.deliverable_id,
       sd.deliverable_ghid,
       sd.deliverable_title,
       t.issue_day,
       t.total_opened,
       t.total_closed,
       t.total_remaining
FROM totals t
CROSS JOIN selected_deliverable sd;
