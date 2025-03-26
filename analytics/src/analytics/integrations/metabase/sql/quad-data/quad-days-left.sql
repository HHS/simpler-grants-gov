WITH current_sprint AS (
  SELECT
    start_date,
    end_date
  FROM app.gh_quad
  WHERE {{ date }} - 1 BETWEEN start_date AND end_date
  LIMIT 1
)
SELECT
  end_date - {{ date }}
FROM current_sprint
