"""add opportunity category table

Revision ID: 479221fb8ba8
Revises: b1eb1bd4a647
Create Date: 2024-02-02 11:36:33.241412

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "479221fb8ba8"
down_revision = "b1eb1bd4a647"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "lk_opportunity_category",
        sa.Column("opportunity_category_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
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
        sa.PrimaryKeyConstraint(
            "opportunity_category_id", name=op.f("lk_opportunity_category_pkey")
        ),
    )
    op.add_column("opportunity", sa.Column("opportunity_category_id", sa.Integer(), nullable=True))
    op.drop_index("opportunity_category_idx", table_name="opportunity")
    op.create_index(
        op.f("opportunity_opportunity_category_id_idx"),
        "opportunity",
        ["opportunity_category_id"],
        unique=False,
    )
    op.create_foreign_key(
        op.f("opportunity_opportunity_category_id_lk_opportunity_category_fkey"),
        "opportunity",
        "lk_opportunity_category",
        ["opportunity_category_id"],
        ["opportunity_category_id"],
    )
    op.drop_column("opportunity", "category")
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "opportunity", sa.Column("category", sa.TEXT(), autoincrement=False, nullable=True)
    )
    op.drop_constraint(
        op.f("opportunity_opportunity_category_id_lk_opportunity_category_fkey"),
        "opportunity",
        type_="foreignkey",
    )
    op.drop_index(op.f("opportunity_opportunity_category_id_idx"), table_name="opportunity")
    op.create_index("opportunity_category_idx", "opportunity", ["category"], unique=False)
    op.drop_column("opportunity", "opportunity_category_id")
    op.drop_table("lk_opportunity_category")
    # ### end Alembic commands ###
