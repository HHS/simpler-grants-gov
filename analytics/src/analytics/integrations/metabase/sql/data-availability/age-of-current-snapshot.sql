SELECT 
    NOW() AS current_datetime, 
    MAX(t_created) AS max_t_created,
    CONCAT(
        FLOOR(EXTRACT(EPOCH FROM (NOW() - MAX(t_created))) / 3600), ' hours, ',
        FLOOR(MOD(EXTRACT(EPOCH FROM (NOW() - MAX(t_created))), 3600) / 60), ' minutes'
    ) AS formatted_time_difference
FROM gh_issue_history
WHERE d_effective = (SELECT MAX(d_effective) FROM gh_issue_history);
