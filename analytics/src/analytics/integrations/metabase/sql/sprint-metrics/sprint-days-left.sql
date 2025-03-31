WITH
  -- get project_id 
  project_data AS (
    SELECT
      gh_project.id AS project_id
    FROM
      gh_project
    WHERE
      {{ghid}}
  )
SELECT
  CASE
    WHEN gh_sprint.end_date - CURRENT_DATE < 0 THEN 0
    WHEN gh_sprint.end_date - CURRENT_DATE > 14 THEN 14
    ELSE gh_sprint.end_date - CURRENT_DATE
  END AS days_remaining
FROM
  project_data,
  gh_sprint
WHERE
  {{sprint_name}}
  AND gh_sprint.project_id = project_data.project_id
