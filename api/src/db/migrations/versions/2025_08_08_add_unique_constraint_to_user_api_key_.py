"""Add unique constraint to user_api_key.key_id

Revision ID: 76140cc4fbf7
Revises: 2547c5b838f8
Create Date: 2025-08-08 15:08:27.903334

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "76140cc4fbf7"
down_revision = "2547c5b838f8"
branch_labels = None
depends_on = None


def upgrade():
    # Add unique index on key_id column
    op.create_index(
        op.f("user_api_key_key_id_idx"), "user_api_key", ["key_id"], unique=True, schema="api"
    )


def downgrade():
    # Remove unique index on key_id column
    op.drop_index(op.f("user_api_key_key_id_idx"), table_name="user_api_key", schema="api")
