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
        FROM issue_id_list)), -- get state of issue at end of sprint to identify DONE issues
issue_state AS
  (SELECT h.d_effective,
          h.issue_id,
          i.issue_title,
          i.issue_ghid,
          h.status,
          h.points,
          i.sprint_start_date,
          i.sprint_end_date
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
   GROUP BY h.issue_id), -- calculate lead time for all DONE issues, with minimum lead time of 1 day
all_lead_times AS
  (SELECT i.issue_id,
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
          OR dd.done_date >= i.sprint_start_date)), -- calculate average lead time
average_lead_time AS
  (SELECT AVG(lead_time_days) AS avg_lead_time_days,
          COUNT(*) AS issues_with_lead_time
   FROM all_lead_times)
SELECT ROUND(avg_lead_time_days, 1) AS average_lead_time_days,
       issues_with_lead_time
FROM average_lead_time
