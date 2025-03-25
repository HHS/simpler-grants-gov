WITH  
  -- Get all deliverables  
  deliverables AS {{#200-all-deliverables-titles-excluding-done}},  
  
  -- Get latest state snapshot for each deliverable  
  deliverable_state AS (  
    SELECT *  
    FROM (  
      SELECT  
        h.deliverable_id,  
        h.status,  
        (h.accept_criteria_done + h.accept_metrics_done) as done_indicators,  
        (h.accept_criteria_total + h.accept_metrics_total) as total_indicators,  
        h.d_effective,  
        ROW_NUMBER() OVER (  
          PARTITION BY h.deliverable_id  
          ORDER BY h.d_effective DESC  
        ) AS ranked_order  
      FROM  
        gh_deliverable_history h  
    ) history  
    WHERE history.ranked_order = 1  
  )  

SELECT  
  d.title AS deliverable_title,  
  h.status,  
  h.done_indicators,
  h.total_indicators,
  (h.total_indicators - h.done_indicators) as open_indicators,
  h.d_effective  
FROM  
  deliverables d  
  JOIN deliverable_state h ON d.deliverable_id = h.deliverable_id  
ORDER BY  
  d.title ASC,  
  h.d_effective DESC;
