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
     AND {{project_ghid}}), -- narrow to issues ever mapped to this sprint, using
 -- the sprint_id index, before ranking their history
candidate_issues AS
  (SELECT DISTINCT issue_id
   FROM gh_issue_sprint_map
   WHERE sprint_id =
       (SELECT sprint_id
        FROM sprint_data)), -- for those candidates only, find each issue's actual most-recent
 -- mapping as of sprint end date (it may not be this sprint,
 -- if the issue was reassigned since)
latest_mapping_for_candidates AS 
  (SELECT DISTINCT ON (m.issue_id) m.issue_id, 
                      m.sprint_id, 
                      m.d_effective 
   FROM gh_issue_sprint_map m 
   INNER JOIN candidate_issues ci ON ci.issue_id = m.issue_id 
   CROSS JOIN sprint_data s 
   WHERE m.d_effective <= CASE 
                              WHEN s.sprint_end_date < CURRENT_DATE THEN s.sprint_end_date 
                              ELSE CURRENT_DATE - 1 
                          END 
   ORDER BY m.issue_id, 
            m.d_effective DESC), -- keep only candidates whose most-recent mapping is actually this sprint
issue_id_list AS 
  (SELECT lmc.issue_id AS issue_id, 
          s.sprint_start_date, 
          s.sprint_end_date 
   FROM latest_mapping_for_candidates lmc 
   CROSS JOIN sprint_data s 
   WHERE lmc.sprint_id = s.sprint_id), -- get metadata for each issue
issue_data AS 
  (SELECT i.id AS issue_id, 
          i.title AS issue_title, 
          i.ghid AS issue_ghid, 
          issue_id_list.sprint_start_date, 
          issue_id_list.sprint_end_date 
   FROM gh_issue i 
   INNER JOIN issue_id_list ON issue_id_list.issue_id = i.id 
   ORDER BY issue_title), -- get history for just this sprint's issues, using the
 -- existing (issue_id, d_effective) index instead of
 -- scanning gh_issue_history by project_id
history_partition AS
  (SELECT *
   FROM gh_issue_history h
   WHERE h.issue_id IN
       (SELECT issue_id
        FROM issue_id_list)), -- get state of issue at end of sprint
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
   ORDER BY h.issue_id)
SELECT *
FROM issue_state
WHERE status != 'Done'
ORDER BY issue_title
