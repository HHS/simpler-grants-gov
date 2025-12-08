WITH -- get sprint_id
sprint_data AS
  (SELECT gh_sprint.id AS sprint_id,
          gh_sprint.project_id,
          gh_sprint.name AS sprint_name,
          gh_sprint.start_date AS sprint_start_date,
          gh_sprint.end_date-1 AS sprint_end_date
   FROM gh_sprint
   INNER JOIN gh_project ON gh_project.id = gh_sprint.project_id
   WHERE {{sprint_name}}
     AND {{project_ghid}}), -- get each issue_id in sprint
issue_id_list AS
  (SELECT DISTINCT issue_id AS issue_id,
                   s.sprint_start_date,
                   s.sprint_end_date
   FROM gh_issue_sprint_map m
   INNER JOIN sprint_data s ON s.sprint_id = m.sprint_id), -- get metadata for each issue
issue_data AS
  (SELECT i.id AS issue_id,
          i.title AS issue_title,
          i.ghid AS issue_ghid,
          issue_id_list.sprint_start_date,
          issue_id_list.sprint_end_date
   FROM gh_issue i
   INNER JOIN issue_id_list ON issue_id_list.issue_id = i.id
   ORDER BY issue_title), -- get partition of issue history
history_partition AS
  (SELECT *
   FROM gh_issue_history h
   INNER JOIN gh_project ON gh_project.id = h.project_id
   WHERE {{project_ghid}}), -- get state of issue at end of sprint to identify DONE issues
issue_state AS
  (SELECT h.d_effective,
          h.issue_id,
          i.issue_title,
          i.issue_ghid,
          concat('https://github.com/', i.issue_ghid) AS issue_url,
          h.status,
          h.points,
          i.sprint_start_date,
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
   ORDER BY h.issue_id), -- get first occurrence of "In Progress" status for each issue
in_progress_dates AS
  (SELECT h.issue_id,
          MIN(h.d_effective) AS in_progress_date
   FROM history_partition h
   INNER JOIN issue_data i ON i.issue_id = h.issue_id
   WHERE h.status = 'In Progress'
   GROUP BY h.issue_id), -- get first occurrence of "Done" status for each issue
done_dates AS
  (SELECT h.issue_id,
          MIN(h.d_effective) AS done_date
   FROM history_partition h
   INNER JOIN issue_data i ON i.issue_id = h.issue_id
   WHERE h.status = 'Done'
   GROUP BY h.issue_id), -- calculate lead time for all DONE issues
lead_time_calculation AS
  (SELECT i.issue_id,
          i.issue_title,
          i.issue_ghid,
          i.issue_url,
          i.points,
          i.pointed,
          i.status,
          i.d_effective,
          ipd.in_progress_date,
          dd.done_date,
          CASE
              WHEN ipd.in_progress_date IS NOT NULL
                   AND dd.done_date IS NOT NULL
                   AND dd.done_date >= ipd.in_progress_date THEN GREATEST(1, dd.done_date - ipd.in_progress_date)
              WHEN dd.done_date IS NOT NULL THEN 1
              ELSE 1
          END AS lead_time_days
   FROM issue_state i
   LEFT JOIN in_progress_dates ipd ON i.issue_id = ipd.issue_id
   LEFT JOIN done_dates dd ON i.issue_id = dd.issue_id
   WHERE i.status = 'Done'
     AND (dd.done_date IS NULL
          OR dd.done_date >= i.sprint_start_date))
SELECT *
FROM lead_time_calculation
ORDER BY issue_title