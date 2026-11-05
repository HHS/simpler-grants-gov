opportunity_search_index_queue_trigger_function = """
CREATE OR REPLACE FUNCTION api.update_opportunity_search_queue()
RETURNS TRIGGER AS $$
DECLARE
    opp_id uuid;
    rec RECORD;
BEGIN
    -- On DELETE the NEW record is null, so resolve everything off OLD instead
    IF (TG_OP = 'DELETE') THEN
        rec := OLD;
    ELSE
        rec := NEW;
    END IF;

    -- Determine the opportunity_id based on the table
    CASE TG_TABLE_NAME
        WHEN 'link_opportunity_summary_funding_instrument' THEN
            opp_id := (SELECT opportunity_id FROM api.opportunity_summary WHERE opportunity_summary_id = rec.opportunity_summary_id);
        WHEN 'link_opportunity_summary_funding_category' THEN
            opp_id := (SELECT opportunity_id FROM api.opportunity_summary WHERE opportunity_summary_id = rec.opportunity_summary_id);
        WHEN 'link_opportunity_summary_applicant_type' THEN
            opp_id := (SELECT opportunity_id FROM api.opportunity_summary WHERE opportunity_summary_id = rec.opportunity_summary_id);
        WHEN 'opportunity_summary' THEN
            opp_id := rec.opportunity_id;
        WHEN 'current_opportunity_summary' THEN
            opp_id := rec.opportunity_id;
        ELSE
            opp_id := rec.opportunity_id;
    END CASE;

    -- Only queue the opportunity while it still exists. When an opportunity is
    -- itself deleted, its child rows are removed in the same cascade, and queuing
    -- from those deletes would dangle a row that violates the opportunity foreign
    -- key. Hard deletes of opportunities are handled separately via the
    -- opportunity_index_delete_queue.
    IF opp_id IS NOT NULL AND EXISTS (SELECT 1 FROM api.opportunity WHERE opportunity_id = opp_id) THEN
        INSERT INTO api.opportunity_change_audit (opportunity_id)
        VALUES (opp_id)
        ON CONFLICT (opportunity_id)
        DO UPDATE SET updated_at = CURRENT_TIMESTAMP, is_loaded_to_search = FALSE, is_loaded_to_version_table=FALSE;
    END IF;

    RETURN rec;
END;
$$ LANGUAGE plpgsql;
"""
