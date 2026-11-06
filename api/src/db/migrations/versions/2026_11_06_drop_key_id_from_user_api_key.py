"""drop key_id from user_api_key

Revision ID: 714b0dedaf7d
Revises: 3c9f2e7a1b4d
Create Date: 2026-11-06 19:10:42.581367

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "714b0dedaf7d"
down_revision = "3c9f2e7a1b4d"
branch_labels = None
depends_on = None


def upgrade():
    # Nothing writes or selects key_id since the previous release, so it can go.
    # Dropping the column also drops its unique index (user_api_key_key_id_idx).
    op.drop_column("user_api_key", "key_id", schema="api")


def downgrade():
    # Restores the column and index only. The dropped plaintext values can't be
    # recovered, so the column comes back nullable.
    op.add_column(
        "user_api_key",
        sa.Column(
            "key_id",
            sa.Text(),
            nullable=True,
            comment="AWS API Gateway key identifier",
        ),
        schema="api",
    )
    op.create_index(
        op.f("user_api_key_key_id_idx"), "user_api_key", ["key_id"], unique=True, schema="api"
    )
