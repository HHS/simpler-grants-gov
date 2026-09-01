WITH RECURSIVE -- Get quad id from quad name
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
   ORDER BY qdm.d_effective DESC), -- Get latest epic-to-deliverable mappings only
 latest_epic_mappings AS
  (SELECT DISTINCT ON (m.epic_id) m.epic_id,
                      m.deliverable_id,
                      e.ghid AS epic_ghid,
                      m.d_effective
   FROM gh_epic_deliverable_map m
   JOIN gh_epic e ON m.epic_id = e.id
   ORDER BY m.epic_id,
            m.d_effective DESC), -- Get epics currently mapped to each deliverable
 epics_in_deliverable AS
  (SELECT ds.deliverable_id,
          ds.deliverable_title,
          lem.epic_id,
          lem.epic_ghid,
          e.title AS epic_title
   FROM deliverables ds
   JOIN latest_epic_mappings lem ON lem.deliverable_id = ds.deliverable_id
   JOIN gh_epic e ON e.id = lem.epic_id), -- Build the recursive issue hierarchy, including issues directly linked to a deliverable
 issue_hierarchy AS
  (-- Issues that are direct children of an epic
 SELECT e.deliverable_id,
        e.deliverable_title,
        e.epic_id,
        e.epic_ghid AS root_epic_ghid,
        i.id AS issue_id,
        i.ghid AS issue_ghid,
        i.title AS issue_title,
        i.parent_issue_ghid,
        EXISTS
     (SELECT 1
      FROM gh_epic
      WHERE ghid = i.ghid) AS is_epic,
               EXISTS
     (SELECT 1
      FROM gh_deliverable
      WHERE ghid = i.ghid) AS is_deliverable
   FROM epics_in_deliverable e
   INNER JOIN gh_issue i ON i.parent_issue_ghid = e.epic_ghid
   UNION ALL -- Issues that are direct children of the deliverable
 SELECT ds.deliverable_id,
        ds.deliverable_title,
        NULL AS epic_id,
        NULL AS root_epic_ghid,
        i.id AS issue_id,
        i.ghid AS issue_ghid,
        i.title AS issue_title,
        i.parent_issue_ghid,
        EXISTS
     (SELECT 1
      FROM gh_epic
      WHERE ghid = i.ghid) AS is_epic,
               EXISTS
     (SELECT 1
      FROM gh_deliverable
      WHERE ghid = i.ghid) AS is_deliverable
   FROM deliverables ds
   INNER JOIN gh_issue i ON i.parent_issue_ghid = ds.deliverable_ghid
   UNION ALL -- Recursively find the children of each issue
 SELECT ih.deliverable_id,
        ih.deliverable_title,
        ih.epic_id,
        ih.root_epic_ghid,
        i.id AS issue_id,
        i.ghid AS issue_ghid,
        i.title AS issue_title,
        i.parent_issue_ghid,
        EXISTS
     (SELECT 1
      FROM gh_epic
      WHERE ghid = i.ghid) AS is_epic,
               EXISTS
     (SELECT 1
      FROM gh_deliverable
      WHERE ghid = i.ghid) AS is_deliverable
   FROM gh_issue i
   INNER JOIN issue_hierarchy ih ON i.parent_issue_ghid = ih.issue_ghid), -- For each issue, get the maximum d_effective from gh_issue_history
 latest_issue_date AS
  (SELECT h.issue_id,
          MAX(h.d_effective) AS max_d_effective
   FROM gh_issue_history h
   JOIN issue_hierarchy ih ON h.issue_id = ih.issue_id
   GROUP BY h.issue_id), -- Aggregate points and determine closed state for each issue based on its latest snapshot
 issue_state AS
  (SELECT ih.deliverable_id,
          ih.deliverable_title,
          h.issue_id,
          h.d_effective,
          SUM(h.points) AS total_points,
          MAX(CASE
                  WHEN h.is_closed::BOOLEAN = TRUE THEN 1
                  ELSE 0
              END) AS is_closed
   FROM gh_issue_history h
   INNER JOIN issue_hierarchy ih ON h.issue_id = ih.issue_id
   INNER JOIN latest_issue_date lid ON h.issue_id = lid.issue_id
   AND h.d_effective = lid.max_d_effective
   WHERE NOT ih.is_epic -- Exclude issues that are epics

     AND NOT ih.is_deliverable -- Exclude issues that are deliverables

   GROUP BY ih.deliverable_id,
            ih.deliverable_title,
            h.issue_id,
            h.d_effective) -- Count open and closed points per deliverable and calculate percent complete

SELECT deliverable_id,
       deliverable_title,
       SUM(CASE
               WHEN is_closed = 0 THEN total_points
               ELSE 0
           END) AS points_open,
       SUM(CASE
               WHEN is_closed = 1 THEN total_points
               ELSE 0
           END) AS points_closed,
       SUM(total_points) AS total_points,
       CASE
           WHEN SUM(total_points) = 0 THEN '0%'
           ELSE CONCAT(CEIL(100 * (SUM(CASE
                                           WHEN is_closed = 1 THEN total_points
                                           ELSE 0
                                       END)::DECIMAL / NULLIF(SUM(total_points)::DECIMAL, 0))), '%')
       END AS percent_complete,
       COUNT(*) AS total_issues
FROM issue_state
GROUP BY deliverable_id,
         deliverable_title
ORDER BY deliverable_title;