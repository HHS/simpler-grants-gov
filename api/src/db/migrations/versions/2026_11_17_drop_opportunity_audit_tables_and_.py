"""drop opportunity audit tables and grantor opportunity roles

Revision ID: a05d179754d5
Revises: 714b0dedaf7d
Create Date: 2026-11-17 19:05:25.213762

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a05d179754d5"
down_revision = "714b0dedaf7d"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_index(
        op.f("opportunity_audit_opportunity_id_idx"), table_name="opportunity_audit", schema="api"
    )
    op.drop_index(
        op.f("opportunity_audit_user_id_idx"), table_name="opportunity_audit", schema="api"
    )
    op.drop_table("opportunity_audit", schema="api")
    op.drop_table("lk_opportunity_audit_event", schema="api")
    # ### end Alembic commands ###

    # Delete the Opportunity Editor / Opportunity Publisher roles. The
    # role/lookup sync is upsert-only, so removing them from code does not
    # delete their rows. Role IDs, in order:
    # Opportunity Editor, Opportunity Publisher.
    #
    # Assignments first (only seeded lower-env data exists, so this is a
    # no-op in prod). These were AGENCY-typed roles, so agency_user_role is
    # the only assignment table that can reference them.
    op.execute(
        sa.text(
            "DELETE FROM api.agency_user_role WHERE role_id IN ("
            "'5e612395-9e66-4c12-aae0-b62204221916', 'd1654d1e-01f8-437c-bdf0-636e1f182451')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.link_role_privilege WHERE role_id IN ("
            "'5e612395-9e66-4c12-aae0-b62204221916', 'd1654d1e-01f8-437c-bdf0-636e1f182451')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.link_role_role_type WHERE role_id IN ("
            "'5e612395-9e66-4c12-aae0-b62204221916', 'd1654d1e-01f8-437c-bdf0-636e1f182451')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.role WHERE role_id IN ("
            "'5e612395-9e66-4c12-aae0-b62204221916', 'd1654d1e-01f8-437c-bdf0-636e1f182451')"
        )
    )

    # Delete the privilege lookup rows.
    # privilege_id 19 is CREATE_OPPORTUNITY, 21 is PUBLISH_OPPORTUNITY.
    # link_role_privilege.privilege_id has an FK to lk_privilege, so clear any
    # remaining references first.
    op.execute(sa.text("DELETE FROM api.link_role_privilege WHERE privilege_id IN (19, 21)"))
    op.execute(sa.text("DELETE FROM api.lk_privilege WHERE privilege_id IN (19, 21)"))


def downgrade():
    # Restores the schema only. Deleted opportunity audit data and role
    # assignments are not restored. Lookup and role rows are re-created by
    # the lookup sync when code that defines them is deployed.
    op.create_table(
        "lk_opportunity_audit_event",
        sa.Column("opportunity_audit_event_id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("description", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.PrimaryKeyConstraint(
            "opportunity_audit_event_id", name=op.f("lk_opportunity_audit_event_pkey")
        ),
        schema="api",
    )
    op.create_table(
        "opportunity_audit",
        sa.Column("opportunity_audit_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("opportunity_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("user_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("opportunity_audit_event_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column(
            "opportunity",
            postgresql.JSONB(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
        sa.Column(
            "nonforecast_opportunity_summary",
            postgresql.JSONB(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
        sa.Column(
            "competition",
            postgresql.JSONB(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["opportunity_audit_event_id"],
            ["api.lk_opportunity_audit_event.opportunity_audit_event_id"],
            name=op.f("opportunity_audit_opportunity_audit_event_id_lk_opportu_5d43"),
        ),
        sa.ForeignKeyConstraint(
            ["opportunity_id"],
            ["api.opportunity.opportunity_id"],
            name=op.f("opportunity_audit_opportunity_id_opportunity_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["api.user.user_id"], name=op.f("opportunity_audit_user_id_user_fkey")
        ),
        sa.PrimaryKeyConstraint("opportunity_audit_id", name=op.f("opportunity_audit_pkey")),
        schema="api",
    )
    op.create_index(
        op.f("opportunity_audit_user_id_idx"),
        "opportunity_audit",
        ["user_id"],
        unique=False,
        schema="api",
    )
    op.create_index(
        op.f("opportunity_audit_opportunity_id_idx"),
        "opportunity_audit",
        ["opportunity_id"],
        unique=False,
        schema="api",
    )
    # ### end Alembic commands ###
