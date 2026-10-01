WITH project_data AS {{#restore:Project_Data}},
     oldest_data AS {{#restore:Data_Availability_Oldest}},
     newest_data AS {{#restore:Data_Availability_Newest}},
     sprint_data AS
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
