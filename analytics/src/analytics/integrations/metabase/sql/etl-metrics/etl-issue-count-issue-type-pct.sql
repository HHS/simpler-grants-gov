WITH 

  -- Get the most recent available date from `gh_issue_history`
  max_history_date AS (
    SELECT MAX(d_effective) AS max_date FROM gh_issue_history
  ),

  -- Get the latest issue records from `gh_issue_history`
  latest_issues AS (
    SELECT DISTINCT issue_id 
    FROM gh_issue_history
    WHERE d_effective = (SELECT max_date FROM max_history_date)
  ),

  -- Count total issues grouped by type, ensuring only recent issues are included
  issue_counts AS (
    SELECT 
        COALESCE(i.type, 'Unknown') AS issue_type,  -- Handle NULL types
        COUNT(*) AS issue_count
    FROM latest_issues li
    LEFT JOIN gh_issue i ON li.issue_id = i.id  -- Use LEFT JOIN to ensure all issues are included
    GROUP BY COALESCE(i.type, 'Unknown')
  )

-- Return only the total counts per issue type
SELECT 
    ic.issue_type,
    ic.issue_count
FROM issue_counts ic
ORDER BY ic.issue_count DESC;
