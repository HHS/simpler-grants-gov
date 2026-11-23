"""remove workflow tables

Revision ID: 22b1d39da259
Revises: a05d179754d5
Create Date: 2026-11-20 17:12:38.658660

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "22b1d39da259"
down_revision = "a05d179754d5"
branch_labels = None
depends_on = None


def upgrade():
    # Drop the workflow tables, children before parents, so no dropped table
    # is still referenced by a remaining foreign key.
    op.drop_index(
        op.f("workflow_approval_approval_response_type_id_idx"),
        table_name="workflow_approval",
        schema="api",
    )
    op.drop_index(
        op.f("workflow_approval_approval_type_id_idx"), table_name="workflow_approval", schema="api"
    )
    op.drop_table("workflow_audit", schema="api")
    op.drop_table("workflow_approval", schema="api")
    op.drop_table("workflow_event_history", schema="api")
    op.drop_table("workflow", schema="api")
    op.drop_table("lk_workflow_type", schema="api")
    op.drop_table("lk_approval_type", schema="api")
    op.drop_table("lk_approval_response_type", schema="api")

    # Delete the workflow roles and their privilege data. Only seeded
    # lower-environment data assigns these roles to users, so the user-role
    # deletes are a no-op in prod. Deletes run children-first because
    # link_role_privilege.privilege_id has an FK to lk_privilege.
    #
    # Role IDs (from the previous static_role_values.py):
    #   18258804-a281-41cd-9afb-06061fa7593c = System Workflow Role
    #   df17eaaf-701b-4b9f-9a88-0406beabc68e = Internal Workflow User
    #   66b4238b-8f22-4996-b6ba-712958fd5631 = Grantor Program Officer
    #   4d00cb3c-0cc5-4876-8e09-7067ae0530a2 = Grantor Budget Officer
    op.execute(
        sa.text(
            "DELETE FROM api.internal_user_role WHERE role_id IN ("
            "'18258804-a281-41cd-9afb-06061fa7593c', 'df17eaaf-701b-4b9f-9a88-0406beabc68e')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.agency_user_role WHERE role_id IN ("
            "'66b4238b-8f22-4996-b6ba-712958fd5631', '4d00cb3c-0cc5-4876-8e09-7067ae0530a2')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.link_role_privilege WHERE role_id IN ("
            "'18258804-a281-41cd-9afb-06061fa7593c', 'df17eaaf-701b-4b9f-9a88-0406beabc68e', "
            "'66b4238b-8f22-4996-b6ba-712958fd5631', '4d00cb3c-0cc5-4876-8e09-7067ae0530a2')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.link_role_role_type WHERE role_id IN ("
            "'18258804-a281-41cd-9afb-06061fa7593c', 'df17eaaf-701b-4b9f-9a88-0406beabc68e', "
            "'66b4238b-8f22-4996-b6ba-712958fd5631', '4d00cb3c-0cc5-4876-8e09-7067ae0530a2')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.role WHERE role_id IN ("
            "'18258804-a281-41cd-9afb-06061fa7593c', 'df17eaaf-701b-4b9f-9a88-0406beabc68e', "
            "'66b4238b-8f22-4996-b6ba-712958fd5631', '4d00cb3c-0cc5-4876-8e09-7067ae0530a2')"
        )
    )

    # Delete the workflow privilege lookup rows, leaving ID gaps:
    #   22 = internal_workflow_access
    #   23 = program_officer_approval
    #   24 = budget_officer_approval
    #   27 = internal_workflow_event_send
    op.execute(sa.text("DELETE FROM api.lk_privilege WHERE privilege_id IN (22, 23, 24, 27)"))


def downgrade():
    # Restores the schema only. Deleted workflow data is not restored, and the
    # deleted role and privilege rows would be re-created by the lookup/role
    # sync when code that defines them is deployed.
    op.create_table(
        "lk_approval_response_type",
        sa.Column("approval_response_type_id", sa.INTEGER(), autoincrement=True, nullable=False),
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
            "approval_response_type_id", name=op.f("lk_approval_response_type_pkey")
        ),
        schema="api",
    )
    op.create_table(
        "lk_approval_type",
        sa.Column("approval_type_id", sa.INTEGER(), autoincrement=True, nullable=False),
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
        sa.PrimaryKeyConstraint("approval_type_id", name=op.f("lk_approval_type_pkey")),
        schema="api",
    )
    op.create_table(
        "lk_workflow_type",
        sa.Column("workflow_type_id", sa.INTEGER(), autoincrement=True, nullable=False),
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
        sa.PrimaryKeyConstraint("workflow_type_id", name=op.f("lk_workflow_type_pkey")),
        schema="api",
    )
    op.create_table(
        "workflow",
        sa.Column("workflow_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("workflow_type_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("current_workflow_state", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("is_active", sa.BOOLEAN(), autoincrement=False, nullable=False),
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
        sa.Column("opportunity_id", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column("application_id", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column("application_submission_id", sa.UUID(), autoincrement=False, nullable=True),
        sa.CheckConstraint(
            "num_nonnulls(opportunity_id, application_id, application_submission_id) = 1",
            name=op.f("workflow_exactly_one_nonnull_entity_check"),
        ),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["api.application.application_id"],
            name=op.f("workflow_application_id_application_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["application_submission_id"],
            ["api.application_submission.application_submission_id"],
            name=op.f("workflow_application_submission_id_application_submission_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["opportunity_id"],
            ["api.opportunity.opportunity_id"],
            name=op.f("workflow_opportunity_id_opportunity_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["workflow_type_id"],
            ["api.lk_workflow_type.workflow_type_id"],
            name=op.f("workflow_workflow_type_id_lk_workflow_type_fkey"),
        ),
        sa.PrimaryKeyConstraint("workflow_id", name=op.f("workflow_pkey")),
        schema="api",
    )
    op.create_table(
        "workflow_event_history",
        sa.Column("event_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("workflow_id", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column(
            "event_data",
            postgresql.JSONB(astext_type=sa.Text()),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column(
            "sent_at", postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=False
        ),
        sa.Column("is_successfully_processed", sa.BOOLEAN(), autoincrement=False, nullable=False),
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
            ["workflow_id"],
            ["api.workflow.workflow_id"],
            name=op.f("workflow_event_history_workflow_id_workflow_fkey"),
        ),
        sa.PrimaryKeyConstraint("event_id", name=op.f("workflow_event_history_pkey")),
        schema="api",
    )
    op.create_table(
        "workflow_approval",
        sa.Column("workflow_approval_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("workflow_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("approving_user_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("approval_type_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("event_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("is_still_valid", sa.BOOLEAN(), autoincrement=False, nullable=False),
        sa.Column("comment", sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column("approval_response_type_id", sa.INTEGER(), autoincrement=False, nullable=False),
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
            ["approval_response_type_id"],
            ["api.lk_approval_response_type.approval_response_type_id"],
            name=op.f("workflow_approval_approval_response_type_id_lk_approval_d56f"),
        ),
        sa.ForeignKeyConstraint(
            ["approval_type_id"],
            ["api.lk_approval_type.approval_type_id"],
            name=op.f("workflow_approval_approval_type_id_lk_approval_type_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["approving_user_id"],
            ["api.user.user_id"],
            name=op.f("workflow_approval_approving_user_id_user_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["api.workflow_event_history.event_id"],
            name=op.f("workflow_approval_event_id_workflow_event_history_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["workflow_id"],
            ["api.workflow.workflow_id"],
            name=op.f("workflow_approval_workflow_id_workflow_fkey"),
        ),
        sa.PrimaryKeyConstraint("workflow_approval_id", name=op.f("workflow_approval_pkey")),
        schema="api",
    )
    op.create_index(
        op.f("workflow_approval_approval_type_id_idx"),
        "workflow_approval",
        ["approval_type_id"],
        unique=False,
        schema="api",
    )
    op.create_index(
        op.f("workflow_approval_approval_response_type_id_idx"),
        "workflow_approval",
        ["approval_response_type_id"],
        unique=False,
        schema="api",
    )
    op.create_table(
        "workflow_audit",
        sa.Column("workflow_audit_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("workflow_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("acting_user_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("transition_event", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("source_state", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("target_state", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("event_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column(
            "audit_metadata",
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
            ["acting_user_id"],
            ["api.user.user_id"],
            name=op.f("workflow_audit_acting_user_id_user_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["api.workflow_event_history.event_id"],
            name=op.f("workflow_audit_event_id_workflow_event_history_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["workflow_id"],
            ["api.workflow.workflow_id"],
            name=op.f("workflow_audit_workflow_id_workflow_fkey"),
        ),
        sa.PrimaryKeyConstraint("workflow_audit_id", name=op.f("workflow_audit_pkey")),
        schema="api",
    )
