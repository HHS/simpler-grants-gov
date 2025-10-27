SELECT NOW() - MAX(t_created) AS deliverable_time_since_last_update
FROM gh_deliverable_history
WHERE d_effective =
    (SELECT MAX(d_effective)
     FROM gh_deliverable_history)