WITH issue_data AS
  (SELECT id AS issue_id,
          title,
          TYPE
   FROM gh_issue
   WHERE {{ghid}}),
     sprint_data AS
  (SELECT id,
          name
   FROM gh_sprint)
SELECT h.*,
       sprint_data.name,
       issue_data.title,
       issue_data.type
FROM gh_issue_history h
JOIN issue_data ON issue_data.issue_id = h.issue_id
JOIN sprint_data ON sprint_data.id = h.sprint_id
ORDER BY d_effective DESC