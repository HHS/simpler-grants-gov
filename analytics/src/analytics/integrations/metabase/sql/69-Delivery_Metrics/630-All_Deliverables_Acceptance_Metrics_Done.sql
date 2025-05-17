WITH -- Get quad id from quad name
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
   WHERE history.ranked_order = 1), -- Get deliverables that have not converted to epics or issues
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
          AND CAST(i.t_modified AS DATE) != DATE '2025-02-04')), -- Get deliverables for our given quad id
 deliverables AS
  (SELECT q.quad_id,
          q.quad_name,
          q.quad_ghid,
          d.deliverable_id,
          d.deliverable_title,
          d.deliverable_ghid,
          qdm.d_effective
   FROM quad q
   JOIN quad_deliverable_map qdm ON q.quad_id = qdm.quad_id
   JOIN all_deliverables d ON qdm.deliverable_id = d.deliverable_id
   ORDER BY qdm.d_effective DESC), -- Get latest state snapshot for each deliverable
 deliverable_state AS
  (SELECT *
   FROM
     (SELECT h.deliverable_id,
             h.status,
             h.accept_criteria_done,
             h.accept_criteria_total,
             h.accept_metrics_done,
             h.accept_metrics_total,
             h.d_effective,
             ROW_NUMBER() OVER (PARTITION BY h.deliverable_id
                                ORDER BY h.d_effective DESC) AS ranked_order
      FROM gh_deliverable_history h) history
   WHERE history.ranked_order = 1)
SELECT d.deliverable_title,
       h.status,
       h.accept_criteria_done AS criteria_done,
       h.accept_criteria_total AS criteria_total,
       (h.accept_criteria_total - h.accept_criteria_done) AS criteria_open,
       h.accept_metrics_done AS metrics_done,
       h.accept_metrics_total AS metrics_total,
       (h.accept_metrics_total - h.accept_metrics_done) AS metrics_open,
       h.d_effective
FROM deliverables d
JOIN deliverable_state h ON d.deliverable_id = h.deliverable_id
ORDER BY d.deliverable_title ASC,
         h.d_effective DESC;