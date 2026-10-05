"""backfill key_id_hash and finalize column on user_api_key

Revision ID: 6ad9442a4bd6
Revises: 33fa7d0cffbe
Create Date: 2026-10-05 18:41:06.237568

"""

import sqlalchemy as sa
from alembic import context, op

from src.auth.api_key_config import ApiKeyConfig
from src.db.migrations.utils import backfill_user_api_key_hashes

# revision identifiers, used by Alembic.
revision = "6ad9442a4bd6"
down_revision = "33fa7d0cffbe"
branch_labels = None
depends_on = None


def upgrade():
    # The hashes need the existing key_id values, which we can't read when only
    # generating SQL (offline mode), so the backfill only runs against a real database.
    if not context.is_offline_mode():
        backfill_user_api_key_hashes(op.get_bind(), ApiKeyConfig().pepper)

    op.create_index(
        op.f("user_api_key_key_id_hash_idx"),
        "user_api_key",
        ["key_id_hash"],
        unique=True,
        schema="api",
    )
    op.alter_column(
        "user_api_key",
        "key_id_hash",
        existing_type=sa.TEXT(),
        nullable=False,
        existing_comment="HMAC-SHA256 hash of key_id, keyed with the API key pepper",
        schema="api",
    )


def downgrade():
    # Backfilled hashes are left in place, they're still valid for their key_id
    op.alter_column(
        "user_api_key",
        "key_id_hash",
        existing_type=sa.TEXT(),
        nullable=True,
        existing_comment="HMAC-SHA256 hash of key_id, keyed with the API key pepper",
        schema="api",
    )
    op.drop_index(op.f("user_api_key_key_id_hash_idx"), table_name="user_api_key", schema="api")
