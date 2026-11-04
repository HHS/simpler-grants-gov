"""drop award recommendation tables

Revision ID: a18edfa5c2d6
Revises: 4cbfb435543c
Create Date: 2026-11-03 02:02:55.526167

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a18edfa5c2d6"
down_revision = "4cbfb435543c"
branch_labels = None
depends_on = None


def upgrade():
    # Drop the award recommendation tables, children before parents.
    # Dropping a table also drops its indexes and outgoing foreign keys
    # (including award_recommendation_audit_event -> workflow_approval).
    op.drop_constraint(
        op.f("workflow_award_recommendation_id_award_recommendation_fkey"),
        "workflow",
        schema="api",
        type_="foreignkey",
    )
    op.drop_table("award_recommendation_audit_event", schema="api")
    op.drop_table("award_recommendation_risk_submission", schema="api")
    op.drop_table("award_recommendation_application_submission", schema="api")
    op.drop_table("award_recommendation_submission_detail", schema="api")
    op.drop_table("award_recommendation_risk", schema="api")
    op.drop_table("award_recommendation_review", schema="api")
    op.drop_table("award_recommendation_attachment", schema="api")
    op.drop_table("award_recommendation", schema="api")
    op.drop_table("lk_award_recommendation_audit_event", schema="api")
    op.drop_table("lk_award_recommendation_risk_type", schema="api")
    op.drop_table("lk_award_recommendation_review_type", schema="api")
    op.drop_table("lk_award_recommendation_type", schema="api")
    op.drop_table("lk_award_recommendation_attachment_type", schema="api")
    op.drop_table("lk_award_recommendation_status", schema="api")
    op.drop_table("lk_award_selection_method", schema="api")

    # Delete award recommendation workflows (and their child rows) so the
    # check constraint below can be narrowed without violating existing rows.
    # workflow_type_id 7 is AWARD_RECOMMENDATION_REVIEW.
    op.execute(
        sa.text(
            "DELETE FROM api.workflow_audit WHERE workflow_id IN ("
            "SELECT workflow_id FROM api.workflow WHERE award_recommendation_id IS NOT NULL OR workflow_type_id = 7)"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.workflow_approval WHERE workflow_id IN ("
            "SELECT workflow_id FROM api.workflow WHERE award_recommendation_id IS NOT NULL OR workflow_type_id = 7)"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.workflow_event_history WHERE workflow_id IN ("
            "SELECT workflow_id FROM api.workflow WHERE award_recommendation_id IS NOT NULL OR workflow_type_id = 7)"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.workflow WHERE workflow_id IN ("
            "SELECT workflow_id FROM api.workflow WHERE award_recommendation_id IS NOT NULL OR workflow_type_id = 7)"
        )
    )
    # approval_type_id 4-11 are the award recommendation approval types (PQC..EXECUTIVE)
    op.execute(sa.text("DELETE FROM api.workflow_approval WHERE approval_type_id BETWEEN 4 AND 11"))

    op.drop_constraint(
        "workflow_exactly_one_nonnull_entity_check",
        table_name="workflow",
        schema="api",
    )
    op.drop_column("workflow", "award_recommendation_id", schema="api")
    op.create_check_constraint(
        "workflow_exactly_one_nonnull_entity_check",
        table_name="workflow",
        schema="api",
        condition="num_nonnulls(opportunity_id, application_id, application_submission_id) = 1",
    )

    # Delete the award recommendation roles. The role/lookup sync is upsert-only,
    # so removing them from code does not delete their rows. Role IDs, in order:
    # Award Recommendation User, PQC Reviewer, GMS Reviewer, FMO Reviewer,
    # GMO Reviewer, Final Award Rec Approver.
    op.execute(
        sa.text(
            "DELETE FROM api.agency_user_role WHERE role_id IN ("
            "'a5a5881e-2b55-4044-bf4d-eec45503cc56', '8b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '9c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', '0d4e5f6a-7b8c-9d0e-1f2a3b4c5d6e7f8a', '1e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '2f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.internal_user_role WHERE role_id IN ("
            "'a5a5881e-2b55-4044-bf4d-eec45503cc56', '8b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '9c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', '0d4e5f6a-7b8c-9d0e-1f2a3b4c5d6e7f8a', '1e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '2f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.organization_user_role WHERE role_id IN ("
            "'a5a5881e-2b55-4044-bf4d-eec45503cc56', '8b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '9c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', '0d4e5f6a-7b8c-9d0e-1f2a3b4c5d6e7f8a', '1e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '2f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.application_user_role WHERE role_id IN ("
            "'a5a5881e-2b55-4044-bf4d-eec45503cc56', '8b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '9c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', '0d4e5f6a-7b8c-9d0e-1f2a3b4c5d6e7f8a', '1e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '2f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.link_organization_invitation_to_role WHERE role_id IN ("
            "'a5a5881e-2b55-4044-bf4d-eec45503cc56', '8b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '9c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', '0d4e5f6a-7b8c-9d0e-1f2a3b4c5d6e7f8a', '1e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '2f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.link_role_role_type WHERE role_id IN ("
            "'a5a5881e-2b55-4044-bf4d-eec45503cc56', '8b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '9c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', '0d4e5f6a-7b8c-9d0e-1f2a3b4c5d6e7f8a', '1e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '2f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.link_role_privilege WHERE role_id IN ("
            "'a5a5881e-2b55-4044-bf4d-eec45503cc56', '8b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '9c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', '0d4e5f6a-7b8c-9d0e-1f2a3b4c5d6e7f8a', '1e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '2f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.role WHERE role_id IN ("
            "'a5a5881e-2b55-4044-bf4d-eec45503cc56', '8b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '9c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', '0d4e5f6a-7b8c-9d0e-1f2a3b4c5d6e7f8a', '1e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '2f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c')"
        )
    )

    # Delete the lookup rows, leaving ID gaps (IDs are never reused).
    # privilege_id 28-31 and 34-38 are the award recommendation privileges.
    op.execute(
        sa.text(
            "DELETE FROM api.link_role_privilege"
            " WHERE privilege_id IN (28, 29, 30, 31, 34, 35, 36, 37, 38)"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM api.lk_privilege WHERE privilege_id IN (28, 29, 30, 31, 34, 35, 36, 37, 38)"
        )
    )
    op.execute(sa.text("DELETE FROM api.lk_approval_type WHERE approval_type_id BETWEEN 4 AND 11"))
    op.execute(sa.text("DELETE FROM api.lk_workflow_type WHERE workflow_type_id = 7"))


def downgrade():
    # Restores the schema only. Deleted award recommendation data, workflows,
    # and role assignments are not restored. Lookup and role rows are
    # re-created by the lookup sync when code that defines them is deployed.
    op.create_table(
        "lk_award_selection_method",
        sa.Column("award_selection_method_id", sa.INTEGER(), autoincrement=True, nullable=False),
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
            "award_selection_method_id", name=op.f("lk_award_selection_method_pkey")
        ),
        schema="api",
    )
    op.create_table(
        "lk_award_recommendation_status",
        sa.Column(
            "award_recommendation_status_id", sa.INTEGER(), autoincrement=True, nullable=False
        ),
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
            "award_recommendation_status_id", name=op.f("lk_award_recommendation_status_pkey")
        ),
        schema="api",
    )
    op.create_table(
        "lk_award_recommendation_attachment_type",
        sa.Column(
            "award_recommendation_attachment_type_id",
            sa.INTEGER(),
            autoincrement=True,
            nullable=False,
        ),
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
            "award_recommendation_attachment_type_id",
            name=op.f("lk_award_recommendation_attachment_type_pkey"),
        ),
        schema="api",
    )
    op.create_table(
        "lk_award_recommendation_type",
        sa.Column("award_recommendation_type_id", sa.INTEGER(), autoincrement=True, nullable=False),
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
            "award_recommendation_type_id", name=op.f("lk_award_recommendation_type_pkey")
        ),
        schema="api",
    )
    op.create_table(
        "lk_award_recommendation_review_type",
        sa.Column(
            "award_recommendation_review_type_id", sa.INTEGER(), autoincrement=True, nullable=False
        ),
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
            "award_recommendation_review_type_id",
            name=op.f("lk_award_recommendation_review_type_pkey"),
        ),
        schema="api",
    )
    op.create_table(
        "lk_award_recommendation_risk_type",
        sa.Column(
            "award_recommendation_risk_type_id", sa.INTEGER(), autoincrement=True, nullable=False
        ),
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
            "award_recommendation_risk_type_id", name=op.f("lk_award_recommendation_risk_type_pkey")
        ),
        schema="api",
    )
    op.create_table(
        "lk_award_recommendation_audit_event",
        sa.Column(
            "award_recommendation_audit_event_id", sa.INTEGER(), autoincrement=True, nullable=False
        ),
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
            "award_recommendation_audit_event_id",
            name=op.f("lk_award_recommendation_audit_event_pkey"),
        ),
        schema="api",
    )
    op.create_table(
        "award_recommendation",
        sa.Column("award_recommendation_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("opportunity_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("award_recommendation_number", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column(
            "award_recommendation_status_id", sa.INTEGER(), autoincrement=False, nullable=False
        ),
        sa.Column("additional_info", sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column("award_selection_method_id", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("other_key_information", sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column("is_deleted", sa.BOOLEAN(), autoincrement=False, nullable=False),
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
        sa.Column("selection_method_detail", sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column("funding_strategy", sa.TEXT(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(
            ["award_recommendation_status_id"],
            ["api.lk_award_recommendation_status.award_recommendation_status_id"],
            name=op.f("award_recommendation_award_recommendation_status_id_lk__24b3"),
        ),
        sa.ForeignKeyConstraint(
            ["award_selection_method_id"],
            ["api.lk_award_selection_method.award_selection_method_id"],
            name=op.f("award_recommendation_award_selection_method_id_lk_award_fd5f"),
        ),
        sa.ForeignKeyConstraint(
            ["opportunity_id"],
            ["api.opportunity.opportunity_id"],
            name=op.f("award_recommendation_opportunity_id_opportunity_fkey"),
        ),
        sa.PrimaryKeyConstraint("award_recommendation_id", name=op.f("award_recommendation_pkey")),
        schema="api",
    )
    op.create_index(
        op.f("award_recommendation_opportunity_id_idx"),
        "award_recommendation",
        ["opportunity_id"],
        unique=False,
        schema="api",
    )
    op.create_index(
        op.f("award_recommendation_award_recommendation_number_idx"),
        "award_recommendation",
        ["award_recommendation_number"],
        unique=False,
        schema="api",
    )
    op.create_table(
        "award_recommendation_attachment",
        sa.Column(
            "award_recommendation_attachment_id", sa.UUID(), autoincrement=False, nullable=False
        ),
        sa.Column("award_recommendation_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("file_location", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("file_name", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column(
            "award_recommendation_attachment_type_id",
            sa.INTEGER(),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("uploading_user_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("is_deleted", sa.BOOLEAN(), autoincrement=False, nullable=False),
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
            ["award_recommendation_attachment_type_id"],
            ["api.lk_award_recommendation_attachment_type.award_recommendation_attachment_type_id"],
            name=op.f("award_recommendation_attachment_award_recommendation_at_53c8"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_id"],
            ["api.award_recommendation.award_recommendation_id"],
            name=op.f("award_recommendation_attachment_award_recommendation_id_10c6"),
        ),
        sa.ForeignKeyConstraint(
            ["uploading_user_id"],
            ["api.user.user_id"],
            name=op.f("award_recommendation_attachment_uploading_user_id_user_fkey"),
        ),
        sa.PrimaryKeyConstraint(
            "award_recommendation_attachment_id", name=op.f("award_recommendation_attachment_pkey")
        ),
        schema="api",
    )
    op.create_index(
        op.f("award_recommendation_attachment_award_recommendation_id_idx"),
        "award_recommendation_attachment",
        ["award_recommendation_id"],
        unique=False,
        schema="api",
    )
    op.create_table(
        "award_recommendation_review",
        sa.Column("award_recommendation_review_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("award_recommendation_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column(
            "award_recommendation_review_type_id", sa.INTEGER(), autoincrement=False, nullable=False
        ),
        sa.Column("is_reviewed", sa.BOOLEAN(), autoincrement=False, nullable=False),
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
            ["award_recommendation_id"],
            ["api.award_recommendation.award_recommendation_id"],
            name=op.f("award_recommendation_review_award_recommendation_id_awa_ec53"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_review_type_id"],
            ["api.lk_award_recommendation_review_type.award_recommendation_review_type_id"],
            name=op.f("award_recommendation_review_award_recommendation_review_ea4b"),
        ),
        sa.PrimaryKeyConstraint(
            "award_recommendation_review_id", name=op.f("award_recommendation_review_pkey")
        ),
        schema="api",
    )
    op.create_index(
        op.f("award_recommendation_review_award_recommendation_id_idx"),
        "award_recommendation_review",
        ["award_recommendation_id"],
        unique=False,
        schema="api",
    )
    op.create_table(
        "award_recommendation_risk",
        sa.Column("award_recommendation_risk_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("award_recommendation_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column(
            "award_recommendation_risk_number", sa.TEXT(), autoincrement=False, nullable=False
        ),
        sa.Column(
            "award_recommendation_risk_type_id", sa.INTEGER(), autoincrement=False, nullable=False
        ),
        sa.Column("comment", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("is_deleted", sa.BOOLEAN(), autoincrement=False, nullable=False),
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
            ["award_recommendation_id"],
            ["api.award_recommendation.award_recommendation_id"],
            name=op.f("award_recommendation_risk_award_recommendation_id_award_b6a3"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_risk_type_id"],
            ["api.lk_award_recommendation_risk_type.award_recommendation_risk_type_id"],
            name=op.f("award_recommendation_risk_award_recommendation_risk_typ_403b"),
        ),
        sa.PrimaryKeyConstraint(
            "award_recommendation_risk_id", name=op.f("award_recommendation_risk_pkey")
        ),
        schema="api",
    )
    op.create_index(
        op.f("award_recommendation_risk_award_recommendation_risk_number_idx"),
        "award_recommendation_risk",
        ["award_recommendation_risk_number"],
        unique=False,
        schema="api",
    )
    op.create_index(
        op.f("award_recommendation_risk_award_recommendation_id_idx"),
        "award_recommendation_risk",
        ["award_recommendation_id"],
        unique=False,
        schema="api",
    )
    op.create_table(
        "award_recommendation_submission_detail",
        sa.Column(
            "award_recommendation_submission_detail_id",
            sa.UUID(),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("recommended_amount", sa.NUMERIC(), autoincrement=False, nullable=True),
        sa.Column("scoring_comment", sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column("general_comment", sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column("award_recommendation_type_id", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("has_exception", sa.BOOLEAN(), autoincrement=False, nullable=False),
        sa.Column("exception_detail", sa.TEXT(), autoincrement=False, nullable=True),
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
            ["award_recommendation_type_id"],
            ["api.lk_award_recommendation_type.award_recommendation_type_id"],
            name=op.f("award_recommendation_submission_detail_award_recommenda_b4cd"),
        ),
        sa.PrimaryKeyConstraint(
            "award_recommendation_submission_detail_id",
            name=op.f("award_recommendation_submission_detail_pkey"),
        ),
        schema="api",
    )
    op.create_table(
        "award_recommendation_application_submission",
        sa.Column(
            "award_recommendation_application_submission_id",
            sa.UUID(),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("award_recommendation_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("application_submission_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column(
            "award_recommendation_submission_detail_id",
            sa.UUID(),
            autoincrement=False,
            nullable=False,
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
            ["application_submission_id"],
            ["api.application_submission.application_submission_id"],
            name=op.f("award_recommendation_application_submission_application_ca0e"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_id"],
            ["api.award_recommendation.award_recommendation_id"],
            name=op.f("award_recommendation_application_submission_award_recom_afe5"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_submission_detail_id"],
            [
                "api.award_recommendation_submission_detail.award_recommendation_submission_detail_id"
            ],
            name=op.f("award_recommendation_application_submission_award_recom_0d71"),
        ),
        sa.PrimaryKeyConstraint(
            "award_recommendation_application_submission_id",
            name=op.f("award_recommendation_application_submission_pkey"),
        ),
        schema="api",
    )
    op.create_index(
        op.f("award_recommendation_application_submission_award_recom_24d6"),
        "award_recommendation_application_submission",
        ["award_recommendation_id"],
        unique=False,
        schema="api",
    )
    op.create_table(
        "award_recommendation_risk_submission",
        sa.Column("award_recommendation_risk_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column(
            "award_recommendation_application_submission_id",
            sa.UUID(),
            autoincrement=False,
            nullable=False,
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
            ["award_recommendation_application_submission_id"],
            [
                "api.award_recommendation_application_submission.award_recommendation_application_submission_id"
            ],
            name=op.f("award_recommendation_risk_submission_award_recommendati_0d67"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_risk_id"],
            ["api.award_recommendation_risk.award_recommendation_risk_id"],
            name=op.f("award_recommendation_risk_submission_award_recommendati_5b2b"),
        ),
        sa.PrimaryKeyConstraint(
            "award_recommendation_risk_id",
            "award_recommendation_application_submission_id",
            name=op.f("award_recommendation_risk_submission_pkey"),
        ),
        schema="api",
    )
    op.create_table(
        "award_recommendation_audit_event",
        sa.Column("award_recommendation_audit_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("award_recommendation_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("user_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column(
            "award_recommendation_audit_event_id", sa.INTEGER(), autoincrement=False, nullable=False
        ),
        sa.Column("award_recommendation_risk_id", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column(
            "award_recommendation_attachment_id", sa.UUID(), autoincrement=False, nullable=True
        ),
        sa.Column("award_recommendation_review_id", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column(
            "award_recommendation_application_submission_id",
            sa.UUID(),
            autoincrement=False,
            nullable=True,
        ),
        sa.Column("workflow_approval_id", sa.UUID(), autoincrement=False, nullable=True),
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
            ["award_recommendation_application_submission_id"],
            [
                "api.award_recommendation_application_submission.award_recommendation_application_submission_id"
            ],
            name=op.f("award_recommendation_audit_event_award_recommendation_a_e01e"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_attachment_id"],
            ["api.award_recommendation_attachment.award_recommendation_attachment_id"],
            name=op.f("award_recommendation_audit_event_award_recommendation_a_36d5"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_audit_event_id"],
            ["api.lk_award_recommendation_audit_event.award_recommendation_audit_event_id"],
            name=op.f("award_recommendation_audit_event_award_recommendation_a_0ee7"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_id"],
            ["api.award_recommendation.award_recommendation_id"],
            name=op.f("award_recommendation_audit_event_award_recommendation_i_99b5"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_review_id"],
            ["api.award_recommendation_review.award_recommendation_review_id"],
            name=op.f("award_recommendation_audit_event_award_recommendation_r_0c9b"),
        ),
        sa.ForeignKeyConstraint(
            ["award_recommendation_risk_id"],
            ["api.award_recommendation_risk.award_recommendation_risk_id"],
            name=op.f("award_recommendation_audit_event_award_recommendation_r_733f"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["api.user.user_id"],
            name=op.f("award_recommendation_audit_event_user_id_user_fkey"),
        ),
        sa.ForeignKeyConstraint(
            ["workflow_approval_id"],
            ["api.workflow_approval.workflow_approval_id"],
            name=op.f("award_recommendation_audit_event_workflow_approval_id_w_4a5b"),
        ),
        sa.PrimaryKeyConstraint(
            "award_recommendation_audit_id", name=op.f("award_recommendation_audit_event_pkey")
        ),
        schema="api",
    )
    op.create_index(
        op.f("award_recommendation_audit_event_award_recommendation_id_idx"),
        "award_recommendation_audit_event",
        ["award_recommendation_id"],
        unique=False,
        schema="api",
    )
    op.add_column(
        "workflow",
        sa.Column("award_recommendation_id", sa.UUID(), autoincrement=False, nullable=True),
        schema="api",
    )
    op.create_foreign_key(
        op.f("workflow_award_recommendation_id_award_recommendation_fkey"),
        "workflow",
        "award_recommendation",
        ["award_recommendation_id"],
        ["award_recommendation_id"],
        source_schema="api",
        referent_schema="api",
    )
    op.drop_constraint(
        "workflow_exactly_one_nonnull_entity_check",
        table_name="workflow",
        schema="api",
    )
    op.create_check_constraint(
        "workflow_exactly_one_nonnull_entity_check",
        table_name="workflow",
        schema="api",
        condition="num_nonnulls(opportunity_id, application_id, application_submission_id, award_recommendation_id) = 1",
    )
