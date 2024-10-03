"""Make number of awards a big int

Revision ID: fa38970d0cef
Revises: 4f7acbb61548
Create Date: 2024-10-01 14:06:12.736411

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "fa38970d0cef"
down_revision = "4f7acbb61548"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "opportunity_summary",
        "expected_number_of_awards",
        existing_type=sa.INTEGER(),
        type_=sa.BigInteger(),
        existing_nullable=True,
        schema="api",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "opportunity_summary",
        "expected_number_of_awards",
        existing_type=sa.BigInteger(),
        type_=sa.INTEGER(),
        existing_nullable=True,
        schema="api",
    )
    # ### end Alembic commands ###