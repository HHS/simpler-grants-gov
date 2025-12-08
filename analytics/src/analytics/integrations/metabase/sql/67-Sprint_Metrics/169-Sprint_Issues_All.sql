WITH -- get sprint_id
sprint_data AS
  (SELECT gh_sprint.id AS sprint_id,
          gh_sprint.project_id,
          gh_sprint.name AS sprint_name,
          gh_sprint.end_date-1 AS sprint_end_date
   FROM gh_sprint
   INNER JOIN gh_project ON gh_project.id = gh_sprint.project_id
   WHERE {{sprint_name}}
     AND {{project_ghid}}), -- get each issue_id in sprint
issue_id_list AS
  (SELECT DISTINCT issue_id AS issue_id,
                   s.sprint_end_date
   FROM gh_issue_sprint_map m
   INNER JOIN sprint_data s ON s.sprint_id = m.sprint_id), -- get metadata for each issue
issue_data AS
  (SELECT i.id AS issue_id,
          i.title AS issue_title,
          i.ghid AS issue_ghid,
          issue_id_list.sprint_end_date
   FROM gh_issue i
   INNER JOIN issue_id_list ON issue_id_list.issue_id = i.id
   ORDER BY issue_title), -- get partition of issue history
history_partition AS
  (SELECT *
   FROM gh_issue_history h
   INNER JOIN gh_project ON gh_project.id = h.project_id
   WHERE {{project_ghid}}), -- get state of issue at end of sprint
issue_state AS
  (SELECT h.d_effective,
          h.issue_id,
          i.issue_title,
          i.issue_ghid,
          concat('https://github.com/', i.issue_ghid) AS issue_url,
          h.status,
          h.points,
          i.sprint_end_date,
          CASE
              WHEN h.points > 0 THEN '√'
              ELSE NULL
          END AS pointed
   FROM history_partition h
   INNER JOIN issue_data i ON i.issue_id = h.issue_id
   WHERE (i.sprint_end_date < CURRENT_DATE
          AND h.d_effective = i.sprint_end_date)
     OR (i.sprint_end_date >= CURRENT_DATE
         AND h.d_effective = CURRENT_DATE - 1)
   ORDER BY h.issue_id)
SELECT *
FROM issue_state
ORDER BY issue_title