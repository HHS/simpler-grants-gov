WITH
  epics_in_deliverable AS (
    SELECT
      gh_deliverable.id AS deliverable_id,
      e.id AS epic_id,
      e.title AS epic_title,
      e.ghid as epic_ghid,
      concat('https://github.com/', e.ghid) AS url
    FROM
      gh_deliverable,
      gh_epic_deliverable_map AS m,
      gh_epic AS e
    WHERE
      m.epic_id = e.id
      AND m.deliverable_id = gh_deliverable.id
      AND {{deliverable_title}}
    GROUP BY
      gh_deliverable.id,
      e.id
    ORDER BY
      gh_deliverable.title,
      e.title
  )
  select * from epics_in_deliverable
