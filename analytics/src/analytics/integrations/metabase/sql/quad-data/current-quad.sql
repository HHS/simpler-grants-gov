WITH current_quad AS (
  SELECT
    name
  FROM app.gh_quad
  WHERE current_date - 1 BETWEEN start_date AND end_date
  LIMIT 1
)
SELECT name
FROM current_quad
