SELECT
  id AS deliverable_id,
  title,
  ghid,
  concat('https://github.com/', ghid) as url 
FROM
  gh_deliverable
WHERE
  ghid not in ('HHS/simpler-grants-gov/issues/3174')
ORDER BY
  title
