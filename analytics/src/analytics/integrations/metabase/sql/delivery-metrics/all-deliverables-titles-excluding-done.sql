WITH
  -- Get deliverables
  deliverable AS (
    SELECT
      d.id AS deliverable_id,
      d.title,
      d.ghid
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
  ),

  -- Get latest state snapshot for each deliverable
  deliverable_state AS (
    SELECT *
    FROM (
      SELECT
        h.deliverable_id,
        h.status,
        h.d_effective,
        ROW_NUMBER() OVER (
          PARTITION BY h.deliverable_id
          ORDER BY h.d_effective DESC
        ) AS ranked_order,
        d.title,
        d.ghid
      FROM
        gh_deliverable_history h
        JOIN deliverable d ON h.deliverable_id = d.deliverable_id
    ) history
    WHERE history.ranked_order = 1
  ),

  -- Get latest quad mapping per deliverable
  latest_deliverable_quad AS (
    SELECT *
    FROM (
      SELECT
        dm.deliverable_id,
        dm.quad_id,
        dm.d_effective,
        ROW_NUMBER() OVER (
          PARTITION BY dm.deliverable_id
          ORDER BY dm.d_effective DESC
        ) AS ranked_order
      FROM
        gh_deliverable_quad_map dm
    ) quad_history
    WHERE quad_history.ranked_order = 1
  ),

  -- Get quad names for each deliverable using latest mapping
  deliverable_quad AS (
    SELECT
      lq.deliverable_id,
      q.name AS quad_name
    FROM
      latest_deliverable_quad lq
      JOIN gh_quad q ON lq.quad_id = q.id
  )

SELECT
  ds.deliverable_id,
  ds.title,
  ds.status,
  ds.d_effective,
  ds.ghid,
  dq.quad_name,
  CONCAT('https://github.com/', ds.ghid) AS url
FROM
  deliverable_state ds
  LEFT JOIN deliverable_quad dq ON ds.deliverable_id = dq.deliverable_id
WHERE
  ds.status != 'Done'
ORDER BY
  ds.title asc;
