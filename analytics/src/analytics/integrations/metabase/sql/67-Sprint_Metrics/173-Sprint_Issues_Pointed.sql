WITH data_availability AS {{#160-DATA-availability-newest}}, -- get project_id
 project_data AS
  (SELECT gh_project.id AS project_id
   FROM gh_project
   WHERE {{ghid}}), -- get sprint_id
 sprint_data AS
  (SELECT gh_sprint.id AS sprint_id,
          gh_sprint.start_date,
          gh_sprint.end_date-1 AS end_date
   FROM project_data,
        gh_sprint
   WHERE gh_sprint.project_id = project_data.project_id
     AND {{sprint_name}}), -- get list of issue_ids in sprint
 issue_id_list AS
  (SELECT DISTINCT (issue_id)
   FROM app.gh_issue_sprint_map AS ism,
        sprint_data
   WHERE ism.sprint_id = sprint_data.sprint_id), -- get state of each issue on last day of sprint
 issue_state AS
  (SELECT h.issue_id,
          h.points,
          CASE
              WHEN h.points > 0 THEN TRUE
              ELSE FALSE
          END AS has_points
   FROM app.gh_issue_history AS h,
        sprint_data,
        data_availability
   WHERE h.sprint_id = sprint_data.sprint_id
     AND ((-- use last day of sprint as effective date IF it is in the past...
 h.d_effective = sprint_data.end_date
           AND sprint_data.end_date < CURRENT_DATE)
          OR (-- ...otherwise use yesterday
 h.d_effective = data_availability.maximum_date
              AND sprint_data.end_date >= CURRENT_DATE))), -- get pointed count
 pointed AS
  (SELECT count(*) AS total
   FROM issue_state AS i
   WHERE i.has_points = TRUE), -- get unpointed count
 unpointed AS
  (SELECT count(*) AS total
   FROM issue_state AS i
   WHERE i.has_points = FALSE)
SELECT pointed.total AS pointed_total,
       unpointed.total AS unpointed_total,
       pointed.total + unpointed.total AS issue_count,
       pointed.total * 100 / (pointed.total + unpointed.total) AS percent_pointed,
       unpointed.total * 100 / (pointed.total + unpointed.total) AS percent_unpointed
FROM pointed,
     unpointed