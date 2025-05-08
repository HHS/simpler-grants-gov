WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '13 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    )::DATE AS day
),
daily_counts AS (
    SELECT
        DATE(created_at) AS day,
        COUNT(*) AS saved_search_count
    FROM user_saved_search
    WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
    GROUP BY 1
)
SELECT
    TO_CHAR(ds.day, 'Mon DD') AS day_label,
    COALESCE(dc.saved_search_count, 0) AS saved_search_count
FROM date_series ds
LEFT JOIN daily_counts dc ON ds.day = dc.day
ORDER BY ds.day;