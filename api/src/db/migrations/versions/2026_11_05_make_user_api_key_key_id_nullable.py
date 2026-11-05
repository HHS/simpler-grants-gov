"""make user_api_key.key_id nullable

Revision ID: 3c9f2e7a1b4d
Revises: a18edfa5c2d6
Create Date: 2026-11-05 09:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3c9f2e7a1b4d"
down_revision = "a18edfa5c2d6"
branch_labels = None
depends_on = None


def upgrade():
    # New keys no longer store the plaintext key, only key_id_hash.
    # The column is dropped in a follow-up once no deployed code selects it.
    op.alter_column(
        "user_api_key",
        "key_id",
        existing_type=sa.TEXT(),
        nullable=True,
        existing_comment="AWS API Gateway key identifier",
        schema="api",
    )


def downgrade():
    # Fails if any key was created without a plaintext key_id after the upgrade.
    op.alter_column(
        "user_api_key",
        "key_id",
        existing_type=sa.TEXT(),
        nullable=False,
        existing_comment="AWS API Gateway key identifier",
        schema="api",
    )
