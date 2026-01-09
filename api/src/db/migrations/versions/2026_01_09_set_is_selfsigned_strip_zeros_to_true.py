"""set-is-selfsigned-strip-zeros-to-true

Revision ID: d5abb0f1dd26
Revises: de02084c3fdd
Create Date: 2026-01-09 15:04:12.766311

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "d5abb0f1dd26"
down_revision = "de02084c3fdd"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER FOREIGN TABLE legacy.tcertificates ALTER COLUMN is_selfsigned OPTIONS (ADD strip_zeros 'true')"
    )
    # ### end Alembic commands ###


def downgrade():
    op.execute(
        "ALTER FOREIGN TABLE legacy.tcertificates "
        "ALTER COLUMN is_selfsigned OPTIONS (DROP strip_zeros)"
    )
