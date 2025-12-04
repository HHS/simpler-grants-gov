WITH -- get project_id
 project_data AS
  (SELECT gh_project.id AS project_id
   FROM gh_project
   WHERE {{ghid}}), -- get sprint_id for past N sprints
 sprint_data AS
  (SELECT gh_sprint.id AS sprint_id,
          gh_sprint.name AS sprint_name,
          gh_sprint.end_date-1 AS sprint_last_day
   FROM project_data,
        gh_sprint
   WHERE gh_sprint.project_id = project_data.project_id
     AND gh_sprint.start_date <= CURRENT_DATE
   ORDER BY gh_sprint.start_date DESC
   LIMIT 5), -- get last day of each sprint
 sprint_end AS
  (SELECT max(gh_issue_history.d_effective) AS sprint_last_day,
          sprint_data.sprint_name,
          sprint_data.sprint_id
   FROM gh_issue_history,
        sprint_data
   WHERE gh_issue_history.sprint_id = sprint_data.sprint_id
     AND gh_issue_history.d_effective <= sprint_data.sprint_last_day
   GROUP BY sprint_data.sprint_id,
            sprint_data.sprint_name
   ORDER BY sprint_data.sprint_id,
            sprint_data.sprint_name), -- get total closed points as of the last day of the sprint
 velocity_per_sprint AS
  (SELECT sprint_end.sprint_id,
          sprint_end.sprint_name,
          sum(gh_issue_history.points) AS points_closed,
          sprint_end.sprint_last_day
   FROM gh_issue_history,
        sprint_end
   WHERE gh_issue_history.sprint_id = sprint_end.sprint_id
     AND gh_issue_history.d_effective = sprint_end.sprint_last_day
     AND gh_issue_history.is_closed = 1
   GROUP BY sprint_end.sprint_id,
            sprint_end.sprint_name,
            sprint_end.sprint_last_day
   ORDER BY sprint_end.sprint_name)
SELECT *
FROM velocity_per_sprint