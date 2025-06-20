"""adjustments for ebiz join

Revision ID: bf5b294a7b85
Revises: 889abca6de67
Create Date: 2025-06-16 10:05:12.178074

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "bf5b294a7b85"
down_revision = "889abca6de67"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_index(
        op.f("link_external_user_email_idx"),
        "link_external_user",
        ["email"],
        unique=False,
        schema="api",
    )
    op.create_unique_constraint(
        op.f("organization_sam_gov_entity_id_uniq"),
        "organization",
        ["sam_gov_entity_id"],
        schema="api",
    )
    op.create_index(
        op.f("sam_gov_entity_ebiz_poc_email_idx"),
        "sam_gov_entity",
        ["ebiz_poc_email"],
        unique=False,
        schema="api",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(
        op.f("sam_gov_entity_ebiz_poc_email_idx"), table_name="sam_gov_entity", schema="api"
    )
    op.drop_constraint(
        op.f("organization_sam_gov_entity_id_uniq"), "organization", schema="api", type_="unique"
    )
    op.drop_index(
        op.f("link_external_user_email_idx"), table_name="link_external_user", schema="api"
    )
    # ### end Alembic commands ###
