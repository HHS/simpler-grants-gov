"""remove view and update opportunity privileges

Revision ID: 998d458b98ee
Revises: ffdd7b537e47
Create Date: 2026-11-24 13:15:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "998d458b98ee"
down_revision = "ffdd7b537e47"
branch_labels = None
depends_on = None


def upgrade():
    # Delete the unused privilege lookup rows, leaving ID gaps:
    #   18 = view_opportunity
    #   20 = update_opportunity
    # The roles that granted these privileges were removed by earlier
    # migrations, but link_role_privilege.privilege_id has an FK to
    # lk_privilege, so clear any remaining references first.
    op.execute(sa.text("DELETE FROM api.link_role_privilege WHERE privilege_id IN (18, 20)"))
    op.execute(sa.text("DELETE FROM api.lk_privilege WHERE privilege_id IN (18, 20)"))


def downgrade():
    # Data-only migration. The deleted privilege rows would be re-created by
    # the lookup sync when code that defines them is deployed.
    pass
