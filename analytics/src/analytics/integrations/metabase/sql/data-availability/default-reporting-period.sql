WITH reporting_period AS (
    SELECT 
        CURRENT_DATE - INTERVAL '60 days' AS start_date,
        CURRENT_DATE AS end_date
)
SELECT * FROM reporting_period;
