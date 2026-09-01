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
     AND {{sprint_name}}), -- calculate issues opened in the sprint identified by sprint_id
 opened AS
  (SELECT gh_issue_history.d_effective AS DAY,
          count(*) AS total_opened
   FROM gh_issue_history,
        sprint_data
   WHERE gh_issue_history.sprint_id = sprint_data.sprint_id
     AND (gh_issue_history.d_effective >= sprint_data.sprint_start_date
          AND gh_issue_history.d_effective <= sprint_data.sprint_end_date)
   GROUP BY DAY
   ORDER BY DAY), -- calculate issues closed in the sprint
 closed AS
  (SELECT gh_issue_history.d_effective AS DAY,
          count(*) AS total_closed
   FROM gh_issue_history,
        sprint_data
   WHERE gh_issue_history.sprint_id = sprint_data.sprint_id
     AND gh_issue_history.is_closed = 1
     AND (gh_issue_history.d_effective >= sprint_data.sprint_start_date
          AND gh_issue_history.d_effective <= sprint_data.sprint_end_date)
   GROUP BY DAY
   ORDER BY DAY), -- aggregate issues opened and closed by day
 totals AS
  (SELECT opened.day AS DAY,
          opened.total_opened,
          closed.total_closed,
          opened.total_opened - closed.total_closed AS total_remaining
   FROM opened,
        closed
   WHERE opened.day = closed.day
   ORDER BY DAY)
SELECT *
FROM totals