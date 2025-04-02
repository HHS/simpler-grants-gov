WITH
  deliverable AS (
    SELECT
      id AS deliverable_id,
      title
    FROM
      gh_deliverable
    WHERE
      {{deliverable_title}}
  )
SELECT
  d.title,
  h.status,
  h.d_effective
FROM
  deliverable AS d,
  gh_deliverable_history AS h
WHERE
  h.deliverable_id = d.deliverable_id
ORDER BY
  d_effective DESC
LIMIT
  1
