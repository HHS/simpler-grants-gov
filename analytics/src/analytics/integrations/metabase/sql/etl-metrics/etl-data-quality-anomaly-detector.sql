WITH

-- Centralized Constants
constants AS (
    SELECT
        2000 AS min_issue_count,         -- Minimum issue count for the latest day
        20 AS min_deliverable_count,     -- Minimum deliverable count for the latest day
        3500 AS min_point_sum,           -- Minimum total point sum for the latest day
        40 AS min_sprint_count,          -- Minimum number of distinct sprints
        60.0 AS min_pointed_issue_pct,   -- Minimum % of pointed issues
        50.0 AS min_task_issue_pct,      -- Minimum % of task-type issues
        INTERVAL '24 hours' AS max_data_age -- Max allowed age for the latest data
),

-- Get max available dates from both tables
max_dates AS (
    SELECT
        (SELECT MAX(d_effective) FROM gh_issue_history) AS max_issue_date,
        (SELECT MAX(d_effective) FROM gh_deliverable_history) AS max_deliverable_date
),

-- Count issues for the most recent two days
issue_counts AS (
    SELECT
        d_effective,
        COUNT(id) AS issue_count
    FROM gh_issue_history
    WHERE d_effective >= (SELECT max_issue_date FROM max_dates) - INTERVAL '1 day'
    GROUP BY d_effective
),

-- Get issue counts for current and previous day
issue_comparison AS (
    SELECT
        MAX(CASE WHEN d_effective = (SELECT max_issue_date FROM max_dates) THEN issue_count END) AS current_day_issue_count,
        MAX(CASE WHEN d_effective = (SELECT max_issue_date FROM max_dates) - INTERVAL '1 day' THEN issue_count END) AS previous_day_issue_count
    FROM issue_counts
),

-- Count deliverables for the most recent two days
deliverable_counts AS (
    SELECT
        d_effective,
        COUNT(id) AS deliverable_count
    FROM gh_deliverable_history
    WHERE d_effective >= (SELECT max_deliverable_date FROM max_dates) - INTERVAL '1 day'
    GROUP BY d_effective
),

-- Get deliverable counts for current and previous day
deliverable_comparison AS (
    SELECT
        MAX(CASE WHEN d_effective = (SELECT max_deliverable_date FROM max_dates) THEN deliverable_count END) AS current_day_deliverable_count,
        MAX(CASE WHEN d_effective = (SELECT max_deliverable_date FROM max_dates) - INTERVAL '1 day' THEN deliverable_count END) AS previous_day_deliverable_count
    FROM deliverable_counts
),

-- Calculate point sums for the most recent two days
point_sums AS (
    SELECT
        d_effective,
        COALESCE(SUM(points), 0) AS total_points
    FROM gh_issue_history
    WHERE d_effective >= (SELECT max_issue_date FROM max_dates) - INTERVAL '1 day'
    GROUP BY d_effective
),

-- Get point sums for current and previous day
point_comparison AS (
    SELECT
        MAX(CASE WHEN d_effective = (SELECT max_issue_date FROM max_dates) THEN total_points END) AS current_day_point_sum,
        MAX(CASE WHEN d_effective = (SELECT max_issue_date FROM max_dates) - INTERVAL '1 day' THEN total_points END) AS previous_day_point_sum
    FROM point_sums
),

-- Count distinct sprint IDs for the latest day
sprint_count AS (
    SELECT
        COUNT(DISTINCT sprint_id) AS current_day_sprint_count
    FROM gh_issue_history
    WHERE d_effective = (SELECT max_issue_date FROM max_dates)
),

-- Calculate percentage of pointed issues
pointed_issues AS (
    SELECT
        COUNT(*) FILTER (WHERE points > 0) * 100.0 / NULLIF(COUNT(*), 0) AS pointed_issue_pct
    FROM gh_issue_history
    WHERE d_effective = (SELECT max_issue_date FROM max_dates)
),

-- Calculate percentage of task-type issues
task_issues AS (
    SELECT
        COUNT(*) FILTER (WHERE type = 'Task') * 100.0 / NULLIF(COUNT(*), 0) AS task_issue_pct
    FROM gh_issue
),

-- Check last update timestamps for both tables
last_update_check AS (
    SELECT
        (SELECT NOW() - MAX(t_created) FROM gh_issue_history WHERE d_effective = (SELECT max_issue_date FROM max_dates)) AS issue_time_since_last_update,
        (SELECT NOW() - MAX(t_created) FROM gh_deliverable_history WHERE d_effective = (SELECT max_deliverable_date FROM max_dates)) AS deliverable_time_since_last_update
),

-- Ensure minimum thresholds are met
min_threshold_check AS (
    SELECT
        -- Data freshness checks
        CASE
            WHEN (SELECT issue_time_since_last_update FROM last_update_check) > (SELECT max_data_age FROM constants)
            THEN FALSE ELSE TRUE
        END AS is_issue_data_fresh,

        CASE
            WHEN (SELECT deliverable_time_since_last_update FROM last_update_check) > (SELECT max_data_age FROM constants)
            THEN FALSE ELSE TRUE
        END AS is_deliverable_data_fresh,

        -- Record count and other checks
        CASE WHEN (SELECT current_day_issue_count FROM issue_comparison) < (SELECT min_issue_count FROM constants)
            THEN FALSE ELSE TRUE
        END AS is_issue_count_above_min,

        CASE WHEN (SELECT current_day_deliverable_count FROM deliverable_comparison) < (SELECT min_deliverable_count FROM constants)
            THEN FALSE ELSE TRUE
        END AS is_deliverable_count_above_min,

        CASE WHEN (SELECT current_day_point_sum FROM point_comparison) < (SELECT min_point_sum FROM constants)
            THEN FALSE ELSE TRUE
        END AS is_point_sum_above_min,

        CASE WHEN (SELECT current_day_sprint_count FROM sprint_count) < (SELECT min_sprint_count FROM constants)
            THEN FALSE ELSE TRUE
        END AS is_sprint_count_above_min,

        CASE WHEN (SELECT pointed_issue_pct FROM pointed_issues) < (SELECT min_pointed_issue_pct FROM constants)
            THEN FALSE ELSE TRUE
        END AS is_pointed_issue_pct_above_min,

        CASE WHEN (SELECT task_issue_pct FROM task_issues) < (SELECT min_task_issue_pct FROM constants)
            THEN FALSE ELSE TRUE
        END AS is_task_issue_pct_above_min
)

-- Return a row only if unhealthy
SELECT
    '🚨 Data quality validation FAILED' AS etl_health_status,
    ic.previous_day_issue_count,
    ic.current_day_issue_count,
    dc.previous_day_deliverable_count,
    dc.current_day_deliverable_count,
    pc.previous_day_point_sum,
    pc.current_day_point_sum,
    sc.current_day_sprint_count,
    pi.pointed_issue_pct AS current_day_pointed_issue_pct,
    ti.task_issue_pct AS current_day_task_issue_pct,
    fr.failure_reason
FROM
    issue_comparison AS ic
JOIN deliverable_comparison AS dc ON TRUE
JOIN point_comparison AS pc ON TRUE
JOIN sprint_count AS sc ON TRUE
JOIN pointed_issues AS pi ON TRUE
JOIN task_issues AS ti ON TRUE
JOIN min_threshold_check AS mtc ON TRUE
CROSS JOIN LATERAL (
    SELECT STRING_AGG(reason, ', ') AS failure_reason
    FROM (
        SELECT 'issue data age max breached' AS reason WHERE mtc.is_issue_data_fresh = FALSE
        UNION ALL SELECT 'deliverable data age max breached' WHERE mtc.is_deliverable_data_fresh = FALSE
        UNION ALL SELECT 'issue count min breached' WHERE mtc.is_issue_count_above_min = FALSE
        UNION ALL SELECT 'deliverable count min breached' WHERE mtc.is_deliverable_count_above_min = FALSE
        UNION ALL SELECT 'point sum min breached' WHERE mtc.is_point_sum_above_min = FALSE
        UNION ALL SELECT 'sprint count min breached' WHERE mtc.is_sprint_count_above_min = FALSE
        UNION ALL SELECT 'pointed issue pct min breached' WHERE mtc.is_pointed_issue_pct_above_min = FALSE
        UNION ALL SELECT 'task issue pct min breached' WHERE mtc.is_task_issue_pct_above_min = FALSE
    ) AS reasons
) AS fr
WHERE
    mtc.is_issue_data_fresh = FALSE
    OR mtc.is_deliverable_data_fresh = FALSE
    OR mtc.is_issue_count_above_min = FALSE
    OR mtc.is_deliverable_count_above_min = FALSE
    OR mtc.is_point_sum_above_min = FALSE
    OR mtc.is_sprint_count_above_min = FALSE
    OR mtc.is_pointed_issue_pct_above_min = FALSE
    OR mtc.is_task_issue_pct_above_min = FALSE;
