WITH 

  -- Get the most recent available date from `gh_issue_history`
  max_history_date AS (
    SELECT MAX(d_effective) AS max_date FROM gh_issue_history
  ),

  -- Determine pointed vs. unpointed status for each issue_id
  latest_issues AS (
    SELECT 
        issue_id,
        CASE 
            WHEN SUM(CASE WHEN points > 0 THEN 1 ELSE 0 END) > 0 THEN 'pointed'
            ELSE 'unpointed'
        END AS issue_state
    FROM gh_issue_history
    WHERE d_effective = (SELECT max_date FROM max_history_date)
    GROUP BY issue_id
  ),

  -- Count the number of pointed and unpointed issues
  issue_counts AS (
    SELECT 
        issue_state,
        COUNT(*) AS issue_count
    FROM latest_issues
    GROUP BY issue_state
  )

-- Return the final issue count breakdown
SELECT * FROM issue_counts
ORDER BY issue_state;
