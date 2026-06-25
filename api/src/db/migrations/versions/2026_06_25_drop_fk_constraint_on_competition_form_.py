"""drop_fk_constraint_on_competition_form_form_id

Revision ID: ddb6a5c27cdb
Revises: 5fab75294ea6
Create Date: 2026-06-25 19:10:46.525407

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "ddb6a5c27cdb"
down_revision = "5fab75294ea6"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint(
        "competition_form_form_id_form_fkey",
        "competition_form",
        schema="api",
        type_="foreignkey",
    )
    op.drop_table("form", schema="api")


def downgrade():
    op.create_table(
        "form",
        sa.Column("form_id", sa.UUID(), nullable=False),
        sa.Column("form_name", sa.Text(), nullable=False),
        sa.Column("short_form_name", sa.Text(), nullable=False),
        sa.Column("form_version", sa.Text(), nullable=False),
        sa.Column("agency_code", sa.Text(), nullable=False),
        sa.Column("omb_number", sa.Text(), nullable=True),
        sa.Column("legacy_form_id", sa.BigInteger(), nullable=True),
        sa.Column("active_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("inactive_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("form_json_schema", postgresql.JSONB(), nullable=False),
        sa.Column("form_ui_schema", postgresql.JSONB(), nullable=False),
        sa.Column("form_instruction_id", sa.UUID(), nullable=True),
        sa.Column("form_rule_schema", postgresql.JSONB(), nullable=True),
        sa.Column("json_to_xml_schema", postgresql.JSONB(), nullable=True),
        sa.Column("form_type_id", sa.Integer(), nullable=True),
        sa.Column("sgg_version", sa.Text(), nullable=True),
        sa.Column("is_deprecated", sa.Boolean(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["form_instruction_id"],
            ["api.form_instruction.form_instruction_id"],
            name=op.f("form_form_instruction_id_form_instruction_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["form_type_id"],
            ["api.lk_form_type.form_type_id"],
            name=op.f("form_form_type_id_lk_form_type_fkey"),
        ),
        sa.PrimaryKeyConstraint("form_id", name=op.f("form_pkey")),
        sa.UniqueConstraint("legacy_form_id", name=op.f("form_legacy_form_id_key")),
        schema="api",
    )
    op.create_index(
        op.f("form_legacy_form_id_idx"),
        "form",
        ["legacy_form_id"],
        unique=False,
        schema="api",
    )
    op.create_foreign_key(
        "competition_form_form_id_form_fkey",
        "competition_form",
        "form",
        ["form_id"],
        ["form_id"],
        source_schema="api",
        referent_schema="api",
    )
