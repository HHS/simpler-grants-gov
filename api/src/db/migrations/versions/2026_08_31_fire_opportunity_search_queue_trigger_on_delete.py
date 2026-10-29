"""fire opportunity search queue trigger on delete

Revision ID: 21bab8b722bd
Revises: 06ad2e411db3
Create Date: 2026-08-26 00:00:00.000000

"""

from alembic import op

from src.db.migrations.utils import setup_opportunity_search_index_queue_trigger_function

# revision identifiers, used by Alembic.
revision = "21bab8b722bd"
down_revision = "06ad2e411db3"
branch_labels = None
depends_on = None

TRIGGER_TABLES = [
    "opportunity",
    "opportunity_assistance_listing",
    "current_opportunity_summary",
    "opportunity_summary",
    "link_opportunity_summary_funding_instrument",
    "link_opportunity_summary_funding_category",
    "link_opportunity_summary_applicant_type",
    "opportunity_attachment",
]

_FK_NAME = "opportunity_change_audit_opportunity_id_opportunity_fkey"


def upgrade():
    # Re-run the trigger function (now handles AFTER DELETE) and recreate the
    # per-table triggers as AFTER INSERT OR UPDATE OR DELETE.
    setup_opportunity_search_index_queue_trigger_function(op, TRIGGER_TABLES)

    # Now that deletes queue re-index work, deleting an opportunity must cascade
    # to its queue row. Otherwise the child-row deletes in the same cascade
    # re-queue the opportunity and dangle a row that violates this foreign key.
    op.drop_constraint(_FK_NAME, "opportunity_change_audit", schema="api", type_="foreignkey")
    op.create_foreign_key(
        _FK_NAME,
        "opportunity_change_audit",
        "opportunity",
        ["opportunity_id"],
        ["opportunity_id"],
        source_schema="api",
        referent_schema="api",
        ondelete="CASCADE",
    )


def downgrade():
    op.drop_constraint(_FK_NAME, "opportunity_change_audit", schema="api", type_="foreignkey")
    op.create_foreign_key(
        _FK_NAME,
        "opportunity_change_audit",
        "opportunity",
        ["opportunity_id"],
        ["opportunity_id"],
        source_schema="api",
        referent_schema="api",
    )

    # Restore the triggers to AFTER INSERT OR UPDATE only.
    op.execute(opportunity_search_index_queue_trigger_function_insert_update_only)
    for table in TRIGGER_TABLES:
        op.execute(f"""
            CREATE OR REPLACE TRIGGER {table}_queue_trigger
            AFTER INSERT OR UPDATE ON api.{table}
            FOR EACH ROW EXECUTE FUNCTION api.update_opportunity_search_queue();
        """)


# The trigger function as it existed before this migration, used only by
# downgrade so the revert fully restores the prior behavior.
opportunity_search_index_queue_trigger_function_insert_update_only = """
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
