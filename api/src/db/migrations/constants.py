opportunity_search_index_queue_trigger_function = """
CREATE OR REPLACE FUNCTION api.update_opportunity_search_queue()
RETURNS TRIGGER AS $$
DECLARE
    opp_id uuid;
BEGIN
    -- Determine the opportunity_id based on the table
    CASE TG_TABLE_NAME
        WHEN 'link_opportunity_summary_funding_instrument' THEN
            opp_id := (SELECT opportunity_id FROM api.opportunity_summary WHERE opportunity_summary_id = NEW.opportunity_summary_id);
        WHEN 'link_opportunity_summary_funding_category' THEN
            opp_id := (SELECT opportunity_id FROM api.opportunity_summary WHERE opportunity_summary_id = NEW.opportunity_summary_id);
        WHEN 'link_opportunity_summary_applicant_type' THEN
            opp_id := (SELECT opportunity_id FROM api.opportunity_summary WHERE opportunity_summary_id = NEW.opportunity_summary_id);
        WHEN 'opportunity_summary' THEN
            opp_id := NEW.opportunity_id;
        WHEN 'current_opportunity_summary' THEN
            opp_id := NEW.opportunity_id;
        ELSE
            opp_id := NEW.opportunity_id;
    END CASE;

    INSERT INTO api.opportunity_change_audit (opportunity_id)
    VALUES (opp_id)
    ON CONFLICT (opportunity_id)
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP, is_loaded_to_search = FALSE, is_loaded_to_version_table=FALSE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""
