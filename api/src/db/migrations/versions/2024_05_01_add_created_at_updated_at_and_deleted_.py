"""Add created_at, updated_at, and deleted_at columns to staging tables

Revision ID: 1ddd1d051a99
Revises: e3a1be603d26
Create Date: 2024-05-01 11:14:34.332661

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "1ddd1d051a99"
down_revision = "e3a1be603d26"
branch_labels = None
depends_on = None


TABLES = (
    "tapplicanttypes_forecast",
    "tapplicanttypes_forecast_hist",
    "tapplicanttypes_synopsis",
    "tapplicanttypes_synopsis_hist",
    "tforecast",
    "tforecast_hist",
    "tfundactcat_forecast",
    "tfundactcat_forecast_hist",
    "tfundactcat_synopsis",
    "tfundactcat_synopsis_hist",
    "tfundinstr_forecast",
    "tfundinstr_forecast_hist",
    "tfundinstr_synopsis",
    "tfundinstr_synopsis_hist",
    "topportunity",
    "topportunity_cfda",
    "tsynopsis",
    "tsynopsis_hist",
)


def upgrade():
    for table_name in TABLES:
        op.add_column(
            table_name,
            sa.Column(
                "created_at",
                sa.TIMESTAMP(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            schema="staging",
        )
        op.add_column(
            table_name,
            sa.Column(
                "updated_at",
                sa.TIMESTAMP(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            schema="staging",
        )
        op.add_column(
            table_name,
            sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
            schema="staging",
        )


def downgrade():
    for table_name in TABLES:
        op.drop_column(table_name, "deleted_at", schema="staging")
        op.drop_column(table_name, "updated_at", schema="staging")
        op.drop_column(table_name, "created_at", schema="staging")
