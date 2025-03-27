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
        h.accept_criteria_done,  
        h.accept_criteria_total,  
        h.accept_metrics_done,  
        h.accept_metrics_total,  
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
  h.accept_criteria_done AS criteria_done,  
  h.accept_criteria_total AS criteria_total,  
  (h.accept_criteria_total - h.accept_criteria_done) AS criteria_open,  
  h.accept_metrics_done AS metrics_done,  
  h.accept_metrics_total AS metrics_total,  
  (h.accept_metrics_total - h.accept_metrics_done) AS metrics_open,  
  h.d_effective  
FROM  
  deliverables d  
  JOIN deliverable_state h ON d.deliverable_id = h.deliverable_id  
ORDER BY  
  d.title ASC,  
  h.d_effective DESC;
