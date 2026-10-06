"""add opportunity status index to opportunity version

Revision ID: 6a5cdd637577
Revises: 0c0638b3010e
Create Date: 2026-10-06 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "6a5cdd637577"
down_revision = "0c0638b3010e"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "opportunity_version_opportunity_status_idx",
        "opportunity_version",
        [sa.text("(opportunity_data ->> 'opportunity_status')")],
        unique=False,
        schema="api",
    )


def downgrade():
    op.drop_index(
        "opportunity_version_opportunity_status_idx",
        table_name="opportunity_version",
        schema="api",
    )
