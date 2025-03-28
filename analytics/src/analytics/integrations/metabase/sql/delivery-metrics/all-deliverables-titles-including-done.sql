SELECT
  id AS deliverable_id,
  title,
  ghid,
  concat('https://github.com/', ghid) as url
FROM
  gh_deliverable d
    WHERE
      NOT EXISTS (
        SELECT 1
        FROM gh_epic e
        WHERE e.ghid = d.ghid AND e.t_modified > d.t_modified AND CAST(e.t_modified AS DATE) != DATE '2025-02-04'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM gh_issue i
        WHERE i.ghid = d.ghid AND i.t_modified > d.t_modified AND CAST(i.t_modified AS DATE) != DATE '2025-02-04'
     )
ORDER BY
  title
