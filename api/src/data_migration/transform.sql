--
-- Transform queries as SQL.
--

-- ----------------------------------------------------------------------------
-- Insert new records.
WITH transformed_source AS (
    SELECT
      f.opportunity_id::BIGINT,
      f.oppnumber::TEXT AS opportunity_number,
      f.opptitle::TEXT AS opportunity_title,
      f.owningagency::TEXT AS agency,
      CASE f.oppcategory
        WHEN 'D' THEN 1
        WHEN 'M' THEN 2
        WHEN 'C' THEN 3
        WHEN 'E' THEN 4
        WHEN 'O' THEN 5
      END AS opportunity_category_id,
      f.category_explanation::TEXT AS category_explanation,
      f.is_draft = 'Y' AS is_draft,
      f.revision_number::INTEGER AS revision_number,
      f.modified_comments::TEXT AS modified_comments,
      f.publisheruid::TEXT AS publisher_user_id,
      f.publisher_profile_id::BIGINT AS publisher_profile_id
    FROM
      api.foreign_topportunity f
)
INSERT INTO api.opportunity
SELECT * FROM transformed_source
WHERE opportunity_id NOT IN (SELECT opportunity_id FROM api.opportunity);

-- ----------------------------------------------------------------------------
-- Update existing records.
WITH transformed_source AS (
    SELECT
      f.opportunity_id::BIGINT,
      f.oppnumber::TEXT AS opportunity_number,
      f.opptitle::TEXT AS opportunity_title,
      f.owningagency::TEXT AS agency,
      CASE f.oppcategory
        WHEN 'D' THEN 1
        WHEN 'M' THEN 2
        WHEN 'C' THEN 3
        WHEN 'E' THEN 4
        WHEN 'O' THEN 5
      END AS opportunity_category_id,
      f.category_explanation::TEXT AS category_explanation,
      f.is_draft = 'Y' AS is_draft,
      f.revision_number::INTEGER AS revision_number,
      f.modified_comments::TEXT AS modified_comments,
      f.publisheruid::TEXT AS publisher_user_id,
      f.publisher_profile_id::BIGINT AS publisher_profile_id
    FROM
      api.foreign_topportunity f
),
current_data AS (
    SELECT opportunity_id, opportunity_number, opportunity_title, agency,
    opportunity_category_id, category_explanation, is_draft,
    revision_number::INTEGER, modified_comments, publisher_user_id, publisher_profile_id
    FROM api.opportunity
),
updated_opportunities AS (
    (SELECT * FROM transformed_source WHERE opportunity_id IN (SELECT opportunity_id FROM current_data))
    EXCEPT
    (SELECT * FROM current_data)
)
UPDATE api.opportunity opp
SET opportunity_title       = updated_opportunities.opportunity_title,
    agency                  = updated_opportunities.agency,
    opportunity_category_id = updated_opportunities.opportunity_category_id,
    category_explanation    = updated_opportunities.category_explanation,
    is_draft                = updated_opportunities.is_draft,
    revision_number         = updated_opportunities.revision_number,
    modified_comments       = updated_opportunities.modified_comments,
    publisher_user_id       = updated_opportunities.publisher_user_id,
    publisher_profile_id    = updated_opportunities.publisher_profile_id,
    updated_at              = CURRENT_TIMESTAMP
FROM updated_opportunities
WHERE opp.opportunity_id = updated_opportunities.opportunity_id;
