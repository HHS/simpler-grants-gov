WITH RECURSIVE -- Constants
constants AS
  (SELECT 10 AS deliverable_ranked_order), -- Reporting period
reporting_period AS ({{#364-DEFAULT-reporting-period}}), -- All deliverables grouped by quad
all_deliverables AS {{#850-model-quad-deliverables}}, -- Get quad id from selected quad name
quad AS
  (SELECT id AS quad_id,
          name AS quad_name,
          ghid AS quad_ghid,
          start_date,
          end_date
   FROM gh_quad
   WHERE {{quad}}
   ORDER BY name
   LIMIT 1), -- Get deliverable via quad_id and ranked_order
selected_deliverable AS
  (SELECT *
   FROM all_deliverables
   WHERE quad_id =
       (SELECT quad_id
        FROM quad)
     AND ranked_order =
       (SELECT deliverable_ranked_order
        FROM constants)), -- Get latest epic-to-deliverable mappings
latest_epic_mappings AS
  (SELECT DISTINCT ON (edm.epic_id) edm.epic_id,
                      e.ghid AS epic_ghid,
                      edm.deliverable_id,
                      edm.d_effective
   FROM gh_epic_deliverable_map edm
   JOIN gh_epic e ON edm.epic_id = e.id
   ORDER BY edm.epic_id,
            edm.d_effective DESC), -- Get epics currently mapped to the selected deliverable
epics_in_deliverable AS
  (SELECT lem.epic_id,
          lem.epic_ghid,
          lem.deliverable_id
   FROM latest_epic_mappings lem
   JOIN selected_deliverable sd ON lem.deliverable_id = sd.deliverable_id), -- Recursively walk the issue tree from epics
epic_issue_tree AS
  (SELECT e.deliverable_id,
          e.epic_id,
          e.epic_ghid,
          i.id AS issue_id,
          i.ghid AS issue_ghid,
          i.title AS issue_title,
          i.parent_issue_ghid
   FROM epics_in_deliverable e
   JOIN gh_issue i ON i.parent_issue_ghid = e.epic_ghid
   UNION ALL SELECT eit.deliverable_id,
                    eit.epic_id,
                    eit.epic_ghid,
                    i.id AS issue_id,
                    i.ghid AS issue_ghid,
                    i.title AS issue_title,
                    i.parent_issue_ghid
   FROM gh_issue i
   JOIN epic_issue_tree eit ON i.parent_issue_ghid = eit.issue_ghid), -- Filter out issues that are direct children of the deliverable
raw_direct_issues AS
  (SELECT sd.deliverable_id,
          i.id AS issue_id,
          i.ghid AS issue_ghid,
          i.title AS issue_title,
          i.parent_issue_ghid
   FROM selected_deliverable sd
   JOIN gh_issue i ON i.parent_issue_ghid = sd.deliverable_ghid), -- Filter out issues that are actually epics mapped elsewhere
direct_issues AS
  (SELECT rdi.deliverable_id,
          NULL::integer AS epic_id,
          NULL::text AS epic_ghid,
          rdi.issue_id,
          rdi.issue_ghid,
          rdi.issue_title,
          rdi.parent_issue_ghid
   FROM raw_direct_issues rdi
   WHERE NOT EXISTS
       (SELECT 1
        FROM latest_epic_mappings lem
        JOIN gh_epic ep ON lem.epic_id = ep.id
        WHERE ep.ghid = rdi.issue_ghid)), -- Combine both sources
combined_issues AS
  (SELECT *
   FROM epic_issue_tree
   UNION ALL SELECT *
   FROM direct_issues), -- Calculate issues opened in the given time period
opened AS
  (SELECT h.d_effective AS issue_day,
          COUNT(DISTINCT h.issue_id) AS total_opened
   FROM gh_issue_history h
   JOIN combined_issues ci ON h.issue_id = ci.issue_id
   CROSS JOIN reporting_period
   WHERE h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
   GROUP BY h.d_effective
   ORDER BY h.d_effective), -- Calculate issues closed in the given time period
closed AS
  (SELECT h.d_effective AS issue_day,
          COUNT(DISTINCT h.issue_id) AS total_closed
   FROM gh_issue_history h
   JOIN combined_issues ci ON h.issue_id = ci.issue_id
   CROSS JOIN reporting_period
   WHERE h.is_closed::BOOLEAN = TRUE
     AND h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
   GROUP BY h.d_effective
   ORDER BY h.d_effective), -- Aggregate issues opened and closed by day
 totals AS
  (SELECT COALESCE(o.issue_day, c.issue_day) AS issue_day,
          COALESCE(o.total_opened, 0) AS total_opened,
          COALESCE(c.total_closed, 0) AS total_closed,
          COALESCE(o.total_opened, 0) - COALESCE(c.total_closed, 0) AS total_remaining
   FROM opened o
   FULL OUTER JOIN closed c ON o.issue_day = c.issue_day) -- Final output

SELECT sd.deliverable_id,
       sd.deliverable_ghid,
       sd.deliverable_title,
       t.issue_day,
       t.total_opened,
       t.total_closed,
       t.total_remaining
FROM totals t
CROSS JOIN selected_deliverable sd;