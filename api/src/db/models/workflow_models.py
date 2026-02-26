import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import ApprovalResponseType, ApprovalType, WorkflowType
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.competition_models import Application, ApplicationSubmission
from src.db.models.lookup_models import LkApprovalResponseType, LkApprovalType, LkWorkflowType
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User


class Workflow(ApiSchemaTable, TimestampMixin):
    """
    Workflow model for tracking the state of a given instance of a workflow.
    Each entity (e.g. opportunity) has its own, one single workflow instance in this table.

    Attributes:
        workflow_id: Primary key, UUID
        workflow_type_id: Foreign key to lk_workflow_type table
        current_workflow_state: Text field describing the current state of the workflow
        is_active: Boolean flag indicating if the workflow is active, set to False when the workflow hits an end state
    """

    __tablename__ = "workflow"

    #############
    # WARNING
    #############
    # Alembic (our tool that generates migrations) cannot detect if you make
    # changes to this CheckConstraint. If you add a new column to this constraint,
    # you MUST generate a new migration and then manually add the command to delete the old constraint
    # and then add the new constraint.
    #
    # To do this, add the following to the upgrade() of the migration AFTER everything automatically generated
    """
        op.drop_constraint(
        "workflow_exactly_one_nonnull_entity_check",
        table_name="workflow",
        schema="api",
    )
    op.create_check_constraint(
        "workflow_exactly_one_nonnull_entity_check",
        table_name="workflow",
        schema="api",
        # THIS NEEDS TO MATCH WHATEVER COLUMNS YOU ADDED BELOW
        condition="num_nonnulls(opportunity_id, application_id, application_submission_id) = 1",
    )
    """
    # In addition, you need to add the same thing to the downgrade() function
    # but with the condition set to whatever it was before your change.
    # Put this at the TOP of the downgrade before any column changes.
    __table_args__ = (
        CheckConstraint(
            # This check constraint ensures that exactly 1 of the entity columns is not null, no more, no less.
            "num_nonnulls(opportunity_id, application_id, application_submission_id) = 1",
            name="exactly_one_nonnull_entity",
        ),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )

    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    workflow_type: Mapped[WorkflowType] = mapped_column(
        "workflow_type_id",
        LookupColumn(LkWorkflowType),
        ForeignKey(LkWorkflowType.workflow_type_id),
    )

    current_workflow_state: Mapped[str]

    is_active: Mapped[bool]

    workflow_event_history: Mapped[list[WorkflowEventHistory]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )

    workflow_audits: Mapped[list[WorkflowAudit]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )

    workflow_approvals: Mapped[list[WorkflowApproval]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )

    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey(Opportunity.opportunity_id))
    opportunity: Mapped[Opportunity | None] = relationship(Opportunity)

    application_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey(Application.application_id))
    application: Mapped[Application | None] = relationship(Application)

    application_submission_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey(ApplicationSubmission.application_submission_id)
    )
    application_submission: Mapped[ApplicationSubmission | None] = relationship(
        ApplicationSubmission
    )

    def get_log_extra(self) -> dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "workflow_type": self.workflow_type,
            "current_workflow_state": self.current_workflow_state,
            "is_active": self.is_active,
            "opportunity_id": self.opportunity_id,
            "application_id": self.application_id,
            "application_submission_id": self.application_submission_id,
        }


class WorkflowEventHistory(ApiSchemaTable, TimestampMixin):
    """
    WorkflowEventHistory model to store the SQS events in the DB.

    Attributes:
        event_id: Primary key, UUID
        workflow_id: Foreign key to workflow table, note the field is nullable in this table
        event_data: JSONB field containing event data
        sent_timestamp: Timestamp indicating when the event was sent
        is_successfully_processed: Boolean flag indicating if the event was processed successfully
    """

    __tablename__ = "workflow_event_history"

    event_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    workflow_id: Mapped[uuid.UUID | None] = mapped_column(UUID, ForeignKey(Workflow.workflow_id))
    workflow: Mapped[Workflow | None] = relationship(
        Workflow, back_populates="workflow_event_history"
    )

    event_data: Mapped[dict] = mapped_column(JSONB)

    sent_at: Mapped[datetime]

    is_successfully_processed: Mapped[bool]


class WorkflowAudit(ApiSchemaTable, TimestampMixin):
    """
    WorkflowAudit model for tracking all state transitions on a workflow.

    Attributes:
        workflow_audit_id: Primary key, UUID
        workflow_id: Foreign key to workflow table
        acting_user_id: Foreign key to user table indicating who performed the action
        transition_event: Text field describing the transition event
        source_state: Text field indicating the source state before the transition
        target_state: Text field indicating the target state after the transition
        event_id: Foreign key to workflow_event_history table
        audit_metadata: JSONB field for additional metadata about the audit
    """

    __tablename__ = "workflow_audit"

    workflow_audit_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Workflow.workflow_id), nullable=False
    )
    workflow: Mapped[Workflow] = relationship(
        Workflow, back_populates="workflow_audits", single_parent=True
    )

    acting_user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(User.user_id))
    acting_user: Mapped[User] = relationship(User)

    transition_event: Mapped[str]

    source_state: Mapped[str]

    target_state: Mapped[str]

    event_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(WorkflowEventHistory.event_id))

    audit_metadata: Mapped[dict | None] = mapped_column(JSONB)


class WorkflowApproval(ApiSchemaTable, TimestampMixin):
    """
    WorkflowApproval model to store the approval information.

    Attributes:
        workflow_approval_id: Primary key, UUID
        workflow_id: Foreign key to workflow table
        approver_user_id: Foreign key to user table indicating who approved the workflow
        approval_type_id: Foreign key to lk_approval_type table indicating the type of approval
        event_id: Foreign key to workflow_event_history table indicating the event that triggered the approval
        is_still_valid: Boolean flag indicating if the approval is still valid
        approval_response_type_id: Foreign key to lk_approval_response_type table indicating the response type
    """

    __tablename__ = "workflow_approval"

    workflow_approval_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Workflow.workflow_id), nullable=False
    )
    workflow: Mapped[Workflow] = relationship(Workflow)

    approving_user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(User.user_id))
    approving_user: Mapped[User] = relationship(User)

    approval_type: Mapped[ApprovalType] = mapped_column(
        "approval_type_id",
        LookupColumn(LkApprovalType),
        ForeignKey(LkApprovalType.approval_type_id),
        index=True,
    )

    event_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(WorkflowEventHistory.event_id))
    event: Mapped[WorkflowEventHistory] = relationship(WorkflowEventHistory)

    is_still_valid: Mapped[bool]

    comment: Mapped[str | None]

    approval_response_type: Mapped[ApprovalResponseType] = mapped_column(
        "approval_response_type_id",
        LookupColumn(LkApprovalResponseType),
        ForeignKey(LkApprovalResponseType.approval_response_type_id),
        index=True,
    )
