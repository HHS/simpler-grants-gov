"""Remove has_update column from opportunity_search_index_queue

Revision ID: 8b96ade6f6a2
Revises: a8ebde13a18a
Create Date: 2024-10-31 16:57:43.256710

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8b96ade6f6a2"
down_revision = "a8ebde13a18a"
branch_labels = None
depends_on = None


create_old_trigger_function = """
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

    INSERT INTO api.opportunity_search_index_queue (opportunity_id)
    VALUES (opp_id)
    ON CONFLICT (opportunity_id)
    DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

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

    INSERT INTO api.opportunity_search_index_queue (opportunity_id)
    VALUES (opp_id)
    ON CONFLICT (opportunity_id)
    DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""


def upgrade():
    # Update the trigger function
    op.execute(create_trigger_function)

    op.drop_column("opportunity_search_index_queue", "has_update", schema="api")


def downgrade():
    op.execute(create_old_trigger_function)

    op.add_column(
        "opportunity_search_index_queue",
        sa.Column("has_update", sa.BOOLEAN(), autoincrement=False, nullable=False),
        schema="api",
    )
