WITH
  -- 1. Resolve the selected deliverable
  selected_deliverable AS (
    SELECT id, ghid, title
    FROM gh_deliverable
    WHERE {{deliverable_title}}
  ),

  -- 2. Latest epic-to-deliverable mappings only (current mapping)
  latest_epic_mappings AS (
    SELECT DISTINCT ON (edm.epic_id)
      edm.epic_id,
      e.ghid AS epic_ghid,
      edm.deliverable_id,
      edm.d_effective
    FROM gh_epic_deliverable_map edm
    JOIN gh_epic e ON edm.epic_id = e.id
    ORDER BY edm.epic_id, edm.d_effective DESC
  ),

  -- 3. Epics currently mapped to the selected deliverable (using latest mapping)
  epics_in_deliverable AS (
    SELECT
      sd.id AS deliverable_id,
      lem.epic_id,
      e.title AS epic_title,
      lem.epic_ghid,
      CONCAT('https://github.com/', lem.epic_ghid) AS url
    FROM selected_deliverable sd
    JOIN latest_epic_mappings lem ON lem.deliverable_id = sd.id
    JOIN gh_epic e ON e.id = lem.epic_id
  )

SELECT *
FROM epics_in_deliverable
ORDER BY epic_title;  
