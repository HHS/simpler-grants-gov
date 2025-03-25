SELECT
  min(h.d_effective) AS d_effective,
  h.status
FROM
  gh_deliverable_history AS h,
  gh_deliverable
WHERE
  {{deliverable_title}}
  AND h.deliverable_id = gh_deliverable.id
GROUP BY
  h.status
ORDER BY
  d_effective ASC
