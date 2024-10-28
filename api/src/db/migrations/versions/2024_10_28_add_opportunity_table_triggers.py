"""Add opportunity table triggers 

Revision ID: a8ebde13a18a
Revises: a2e9144cdc6b
Create Date: 2024-10-28 17:48:02.678523

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a8ebde13a18a"
down_revision = "a2e9144cdc6b"
branch_labels = None
depends_on = None

create_trigger_function = """
CREATE OR REPLACE FUNCTION update_opportunity_search_queue()
RETURNS TRIGGER AS $$
DECLARE
    opp_id bigint;
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

    INSERT INTO api.opportunity_search_index_queue (opportunity_id, has_update)
    VALUES (opp_id, TRUE)
    ON CONFLICT (opportunity_id)
    DO UPDATE SET has_update = TRUE, updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

# List of tables that need triggers
tables = [
    "opportunity",
    "opportunity_assistance_listing",
    "current_opportunity_summary",
    "opportunity_summary",
    "link_opportunity_summary_funding_instrument",
    "link_opportunity_summary_funding_category",
    "link_opportunity_summary_applicant_type",
    "opportunity_attachment",
]


def upgrade():
    # Create the trigger function
    op.execute(create_trigger_function)

    # Create triggers for each table
    for table in tables:
        op.execute(
            f"""
            CREATE TRIGGER {table}_queue_trigger
            AFTER INSERT OR UPDATE ON api.{table}
            FOR EACH ROW EXECUTE FUNCTION update_opportunity_search_queue();
        """
        )


def downgrade():
    # Drop triggers
    for table in tables:
        op.execute(f"DROP TRIGGER IF EXISTS {table}_queue_trigger ON {table};")

    # Drop the trigger function
    op.execute("DROP FUNCTION IF EXISTS update_opportunity_search_queue();")
