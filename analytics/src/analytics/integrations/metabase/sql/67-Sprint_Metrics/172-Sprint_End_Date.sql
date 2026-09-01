WITH -- get project_id
 project_data AS
  (SELECT gh_project.id AS project_id
   FROM gh_project
   WHERE {{ghid}})
SELECT gh_sprint.end_date-1 AS end_date
FROM project_data,
     gh_sprint
WHERE {{sprint_name}}
  AND gh_sprint.project_id = project_data.project_id