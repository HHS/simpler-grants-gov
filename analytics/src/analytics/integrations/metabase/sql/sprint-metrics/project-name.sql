SELECT
  CASE
    WHEN ghid = 13 THEN 'Simpler.Grants.gov'
    WHEN ghid = 17 THEN 'Product & Delivery'
  END AS scrum_board
FROM
  gh_project
WHERE
  {{ghid}}
