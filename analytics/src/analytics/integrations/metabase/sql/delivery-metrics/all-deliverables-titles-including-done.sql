SELECT
  id AS deliverable_id,
  title,
  ghid,
  concat('https://github.com/', ghid) as url 
FROM
  gh_deliverable
ORDER BY
  title
