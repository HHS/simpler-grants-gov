"""lower_case_serial_num

Revision ID: 3a8c5a22bf74
Revises: 5fab75294ea6
Create Date: 2026-06-02 21:07:50.179167

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "3a8c5a22bf74"
down_revision = "5fab75294ea6"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "UPDATE staging.tcertificates SET serial_num = LOWER(serial_num), certemail = LOWER(certemail)"
    )


def downgrade():
    pass
