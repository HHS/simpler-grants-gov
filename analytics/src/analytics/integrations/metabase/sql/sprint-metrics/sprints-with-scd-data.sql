WITH
  project_data AS {{#168-project-data}},
  oldest_data as {{#159-data-availability-oldest}},
  newest_data as {{#160-data-availability-newest}},
  sprint_data AS (
    SELECT
      gh_sprint.name AS sprint_name,
      gh_sprint.start_date,
      gh_sprint.id AS sprint_id
    FROM
      gh_sprint, oldest_data, newest_data
    WHERE
      {{project_id}}
      AND gh_sprint.start_date >= oldest_data.minimum_date
      AND gh_sprint.start_date <= newest_data.maximum_date
    ORDER BY
      sprint_name
  )
SELECT
  *
FROM
  sprint_data
ORDER BY start_date desc
