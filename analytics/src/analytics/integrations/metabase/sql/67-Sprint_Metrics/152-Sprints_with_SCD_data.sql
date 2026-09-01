WITH project_data AS {{#168-project-DATA}}, oldest_data AS {{#159-DATA-availability-oldest}}, newest_data AS {{#160-DATA-availability-newest}}, sprint_data AS
  (SELECT gh_sprint.name AS sprint_name,
          gh_sprint.start_date,
          gh_sprint.id AS sprint_id
   FROM gh_sprint,
        oldest_data,
        newest_data
   WHERE {{project_id}}
     AND gh_sprint.start_date >= oldest_data.minimum_date
     AND gh_sprint.start_date <= newest_data.maximum_date
   ORDER BY sprint_name DESC)
SELECT *
FROM sprint_data
LIMIT 16