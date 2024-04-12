--
-- SQLMesh model definition.
--

MODEL (
  -- Name of destination table (actually a view that's pointing to a table managed by SQLMesh).
  name api.opportunity_sqlmesh,

  -- Key columns that uniquely identify rows.
  grain opportunity_id,

  -- Can be executed at any time, does not need to align to specific time intervals.
  allow_partials true,

  -- Various model kinds were tested in this proof of concept (one at a time).

  -------------------------------------------------------------------------------------------------
  -- FULL - full dataset rewritten each time:
  --kind FULL,

  -------------------------------------------------------------------------------------------------
  -- INCREMENTAL_BY_UNIQUE_KEY - based on a unique key, rows are added or updated:
  --kind INCREMENTAL_BY_UNIQUE_KEY (
  --  unique_key opportunity_id
  --),

  -------------------------------------------------------------------------------------------------
  -- SCD_TYPE_2_BY_COLUMN - Slowly Changing Dimension (SCD), appends modified rows to keep a full history:
  kind SCD_TYPE_2_BY_COLUMN (
    unique_key opportunity_id,
    columns [opportunity_number, opportunity_title, agency, opportunity_category_id, category_explanation,
             is_draft, revision_number, modified_comments, publisher_user_id, publisher_profile_id]
  )

  -------------------------------------------------------------------------------------------------
);

;

-- SELECT expression for model.
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
  publisher_profile_id::BIGINT AS publisher_profile_id,
FROM
  api.foreign_topportunity;

-- Post-statements to add foreign key references and created_at column.
ALTER TABLE api.opportunity_sqlmesh
ADD FOREIGN KEY (opportunity_category_id) REFERENCES api.lk_opportunity_category(opportunity_category_id);

ALTER TABLE api.opportunity_sqlmesh
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
