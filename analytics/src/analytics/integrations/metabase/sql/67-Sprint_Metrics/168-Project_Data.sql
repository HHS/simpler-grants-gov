SELECT *,
       CASE
           WHEN ghid = 13 THEN 'Nava'
           WHEN ghid = 17 THEN 'Agile Six'
       END AS scrum_board
FROM gh_project
WHERE ghid IN (13,
               17)