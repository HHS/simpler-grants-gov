MODEL (
  name api.opportunity_sqlmesh,
  kind FULL,
  grain opportunity_id,
  allow_partials true

--  columns (
--    opportunity_id BIGINT,
--    opportunity_number TEXT,
--    opportunity_title TEXT,
--    agency TEXT,
--    opportunity_category_id INTEGER REFERENCES api.lk_opportunity_category(opportunity_category_id),
--    category_explanation TEXT,
--    is_draft BOOL,
--    revision_number INTEGER,
--    modified_comments TEXT,
--    publisher_user_id TEXT,
--    publisher_profile_id BIGINT,
--  ),

--  @cron "*/5 * * * *"

--  kind SCD_TYPE_2_BY_COLUMN (
--    unique_key opportunity_id,
--    columns [oppnumber, opptitle, owningagency, oppcategory, category_explanation,
--             is_draft, revision_number, modified_comments, publisheruid, publisher_profile_id]
--  )

--  kind INCREMENTAL_BY_UNIQUE_KEY (
--    unique_key opportunity_id
--  ),
--  @cron "*/5 * * * *"
);

;

SELECT
  opportunity_id::BIGINT,
  oppnumber::TEXT AS opportunity_number,
  opptitle::TEXT AS opportunity_title,
  owningagency::TEXT AS agency,
  CASE oppcategory
    WHEN 'D' THEN 1
    WHEN 'M' THEN 2
    WHEN 'C' THEN 3
    WHEN 'E' THEN 4
    WHEN 'O' THEN 5
  END AS opportunity_category_id,
  category_explanation::TEXT AS category_explanation,
  is_draft == 'Y' AS is_draft,
  revision_number::INTEGER AS revision_number,
  modified_comments::TEXT AS modified_comments,
  publisheruid::TEXT AS publisher_user_id,
  publisher_profile_id::BIGINT AS publisher_profile_id
FROM
  api.foreign_topportunity;

ALTER TABLE api.opportunity_sqlmesh
ADD FOREIGN KEY (opportunity_category_id) REFERENCES api.lk_opportunity_category(opportunity_category_id);
