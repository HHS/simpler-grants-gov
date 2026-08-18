WITH -- get project_id
 project_data AS
  (SELECT gh_project.id AS project_id
   FROM gh_project
   WHERE {{ghid}}), -- get sprint_id for project_id/sprint_name
 sprint_data AS
  (SELECT gh_sprint.id AS sprint_id,
          gh_sprint.start_date AS sprint_start_date,
          gh_sprint.end_date-1 AS sprint_end_date
   FROM project_data,
        gh_sprint
   WHERE gh_sprint.project_id = project_data.project_id
     AND {{sprint_name}}), -- calculate total sprint scope (points tracked) by day
 SCOPE AS
  (SELECT gh_issue_history.d_effective AS DAY,
          sum(gh_issue_history.points) AS total_scope
   FROM gh_issue_history,
        sprint_data
   WHERE gh_issue_history.sprint_id = sprint_data.sprint_id
     AND (gh_issue_history.d_effective >= sprint_data.sprint_start_date
          AND gh_issue_history.d_effective <= sprint_data.sprint_end_date)
   GROUP BY DAY
   ORDER BY DAY), -- calculate points completed in the sprint by day
 completed AS
  (SELECT gh_issue_history.d_effective AS DAY,
          sum(gh_issue_history.points) AS total_completed
   FROM gh_issue_history,
        sprint_data
   WHERE gh_issue_history.sprint_id = sprint_data.sprint_id
     AND gh_issue_history.is_closed = 1
     AND (gh_issue_history.d_effective >= sprint_data.sprint_start_date
          AND gh_issue_history.d_effective <= sprint_data.sprint_end_date)
   GROUP BY DAY
   ORDER BY DAY), -- aggregate scope and completed work by day (both climb toward total scope)
 totals AS
  (SELECT scope.day AS DAY,
          scope.total_scope,
          completed.total_completed
   FROM SCOPE,
        completed
   WHERE scope.day = completed.day
   ORDER BY DAY)
SELECT *
FROM totals
