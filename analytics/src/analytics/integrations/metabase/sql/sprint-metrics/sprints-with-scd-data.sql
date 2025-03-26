WITH
  project_data AS {{#168-project-data}},
  availability_data as {{#159-data-availability-oldest}},
  sprint_data AS (
    SELECT
      gh_sprint.name AS sprint_name,
      gh_sprint.start_date,
      gh_sprint.id AS sprint_id
    FROM
      gh_sprint, availability_data
    WHERE
      {{project_id}}
      AND gh_sprint.start_date >= availability_data.minimum_date
    ORDER BY
      sprint_name
  )
SELECT
  *
FROM
  sprint_data
