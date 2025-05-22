WITH RECURSIVE -- Constants
 constants AS
  (SELECT 6 AS deliverable_ranked_order), -- Get reporting period dynamically
 reporting_period AS ({{#364-DEFAULT-reporting-period}}), -- Get quad id from quad name
 quad AS
  (SELECT id AS quad_id,
          name AS quad_name,
          ghid AS quad_ghid,
          start_date,
          end_date
   FROM gh_quad
   WHERE {{quad}}), -- Get latest quad-deliverable relationships
 quad_deliverable_map AS
  (SELECT *
   FROM
     (SELECT quad_id,
             deliverable_id,
             d_effective,
             ROW_NUMBER() OVER (PARTITION BY deliverable_id
                                ORDER BY d_effective DESC) AS ranked_order
      FROM gh_deliverable_quad_map) history
   WHERE history.ranked_order = 1), -- Get deliverables that have NOT converted to epics or issues
 all_deliverables AS
  (SELECT d.id AS deliverable_id,
          d.title AS deliverable_title,
          d.ghid AS deliverable_ghid
   FROM gh_deliverable d
   WHERE NOT EXISTS
       (SELECT 1
        FROM gh_epic e
        WHERE e.ghid = d.ghid
          AND e.t_modified > d.t_modified
          AND CAST(e.t_modified AS DATE) != DATE '2025-02-04')
     AND NOT EXISTS
       (SELECT 1
        FROM gh_issue i
        WHERE i.ghid = d.ghid
          AND i.t_modified > d.t_modified
          AND CAST(i.t_modified AS DATE) != DATE '2025-02-04')), -- Join sources to generate final collection of deliverables in the given quad
 deliverables AS
  (SELECT q.quad_id,
          q.quad_name,
          q.quad_ghid,
          d.deliverable_id,
          d.deliverable_title,
          d.deliverable_ghid,
          qdm.d_effective,
          ROW_NUMBER() OVER (PARTITION BY q.quad_id
                             ORDER BY d.deliverable_title) AS ranked_order
   FROM quad q
   JOIN quad_deliverable_map qdm ON q.quad_id = qdm.quad_id
   JOIN all_deliverables d ON qdm.deliverable_id = d.deliverable_id
   ORDER BY d.deliverable_title), -- Resolve the selected deliverable using the constant deliverable_ghid
 selected_deliverable AS
  (SELECT deliverable_id,
          deliverable_ghid,
          deliverable_title
   FROM deliverables
   WHERE ranked_order =
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
   FROM direct_issues), -- Calculate points opened in the given time period
 opened AS
  (SELECT h.d_effective AS issue_day,
          SUM(h.points) AS total_opened
   FROM gh_issue_history h
   JOIN combined_issues ci ON h.issue_id = ci.issue_id
   CROSS JOIN reporting_period
   WHERE h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
   GROUP BY h.d_effective
   ORDER BY h.d_effective), -- Calculate points closed in the given time period
 closed AS
  (SELECT h.d_effective AS issue_day,
          SUM(h.points) AS total_closed
   FROM gh_issue_history h
   JOIN combined_issues ci ON h.issue_id = ci.issue_id
   CROSS JOIN reporting_period
   WHERE h.is_closed::BOOLEAN = TRUE
     AND h.d_effective BETWEEN reporting_period.start_date AND reporting_period.end_date
   GROUP BY h.d_effective
   ORDER BY h.d_effective), -- Aggregate points opened and closed by day
 totals AS
  (SELECT COALESCE(o.issue_day, c.issue_day) AS issue_day,
          COALESCE(o.total_opened, 0) AS total_opened,
          COALESCE(c.total_closed, 0) AS total_closed,
          COALESCE(o.total_opened, 0) - COALESCE(c.total_closed, 0) AS total_remaining
   FROM opened o
   FULL OUTER JOIN closed c ON o.issue_day = c.issue_day)
SELECT sd.deliverable_id,
       sd.deliverable_ghid,
       sd.deliverable_title,

  (SELECT CONCAT('https://github.com/', sd.deliverable_ghid)
   FROM constants) AS deliverable_url,
       t.issue_day,
       t.total_opened,
       t.total_closed,
       t.total_remaining
FROM totals t
CROSS JOIN selected_deliverable sd;