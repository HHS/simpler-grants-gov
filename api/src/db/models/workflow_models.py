import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.models.base import ApiSchemaTable, IdMixin, TimestampMixin
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

    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    workflow_type_id: Mapped[int] = mapped_column(
        ForeignKey(LkWorkflowType.workflow_type_id), nullable=False
    )
    workflow_type: Mapped[LkWorkflowType] = relationship(
        LkWorkflowType,
        primaryjoin="Workflow.workflow_type_id == LkWorkflowType.workflow_type_id",
        foreign_keys=[workflow_type_id],
    )

    current_workflow_state: Mapped[str] = mapped_column(Text, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    workflow_event_history: Mapped[list["WorkflowEventHistory"]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )

    workflow_audit: Mapped[list["WorkflowAudit"]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )

    workflow_approval: Mapped[list["WorkflowApproval"]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )

    workflow_opportunity: Mapped[list["WorkflowOpportunity"]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )

    workflow_application: Mapped[list["WorkflowApplication"]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )

    workflow_application_submission: Mapped[list["WorkflowApplicationSubmission"]] = relationship(
        back_populates="workflow", uselist=True, cascade="all, delete-orphan"
    )


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

    workflow_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey(Workflow.workflow_id), nullable=True
    )
    workflow: Mapped[Workflow | None] = relationship(
        Workflow, back_populates="workflow_event_history"
    )

    event_data: Mapped[dict] = mapped_column(JSONB, nullable=False)

    sent_at: Mapped[datetime] = mapped_column(nullable=False)

    is_successfully_processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


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
        Workflow, back_populates="workflow_audit", single_parent=True
    )

    acting_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(User.user_id), nullable=False
    )
    acting_user: Mapped[User] = relationship(
        User,
        primaryjoin="WorkflowAudit.acting_user_id == User.user_id",
        foreign_keys=[acting_user_id],
    )

    transition_event: Mapped[str] = mapped_column(Text, nullable=False)

    source_state: Mapped[str] = mapped_column(Text, nullable=False)

    target_state: Mapped[str] = mapped_column(Text, nullable=False)

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(WorkflowEventHistory.event_id), nullable=False
    )

    audit_metadata: Mapped[dict] = mapped_column(JSONB, nullable=True)


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
    workflow: Mapped[Workflow] = relationship(
        Workflow, back_populates="workflow_approval", single_parent=True
    )

    approving_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(User.user_id), nullable=False
    )
    approving_user: Mapped[User] = relationship(
        User,
        primaryjoin="WorkflowApproval.approving_user_id == User.user_id",
        foreign_keys=[approving_user_id],
    )

    approval_type_id: Mapped[int] = mapped_column(
        ForeignKey(LkApprovalType.approval_type_id), nullable=False
    )
    approval_type: Mapped["LkApprovalType"] = relationship(
        LkApprovalType,
        primaryjoin="WorkflowApproval.approval_type_id == LkApprovalType.approval_type_id",
        foreign_keys=[approval_type_id],
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(WorkflowEventHistory.event_id), nullable=False
    )
    event: Mapped["WorkflowEventHistory"] = relationship(WorkflowEventHistory)

    is_still_valid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    approval_response_type_id: Mapped[int] = mapped_column(
        ForeignKey(LkApprovalResponseType.approval_response_type_id), nullable=False
    )
    approval_response_type: Mapped["LkApprovalResponseType"] = relationship(
        LkApprovalResponseType,
        primaryjoin="WorkflowApproval.approval_response_type_id == LkApprovalResponseType.approval_response_type_id",
        foreign_keys=[approval_response_type_id],
    )


class WorkflowOpportunity(ApiSchemaTable, TimestampMixin):
    """
    WorkflowOpportunity model for linking workflows to opportunities.

    Attributes:
        workflow_opportunity_id: Primary key, UUID
        workflow_id: Foreign key to workflow table
        opportunity_id: UUID field indicating the associated opportunity
    """

    __tablename__ = "workflow_opportunity"

    workflow_opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Workflow.workflow_id))
    workflow: Mapped[Workflow] = relationship(
        Workflow, back_populates="workflow_opportunity", single_parent=True
    )

    opportunity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Opportunity.opportunity_id))


class WorkflowApplication(ApiSchemaTable, TimestampMixin):
    """
    WorkflowApplication model for linking workflows to applications.

    Attributes:
        workflow_application_id: Primary key, UUID
        workflow_id: Foreign key to workflow table
        application_id: UUID field indicating the associated application
    """

    __tablename__ = "workflow_application"

    workflow_application_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Workflow.workflow_id))
    workflow: Mapped[Workflow] = relationship(
        Workflow, back_populates="workflow_application", single_parent=True
    )

    application_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Application.application_id))


class WorkflowApplicationSubmission(ApiSchemaTable, TimestampMixin):
    """
    WorkflowApplicationSubmission model for linking workflows to application submissions.

    Attributes:
        workflow_application_submission_id: Primary key, UUID
        workflow_id: Foreign key to workflow table
        application_submission_id: UUID field indicating the associated application submission
    """

    __tablename__ = "workflow_application_submission"

    workflow_application_submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Workflow.workflow_id))
    workflow: Mapped[Workflow] = relationship(
        Workflow, back_populates="workflow_application_submission", single_parent=True
    )

    application_submission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(ApplicationSubmission.application_submission_id)
    )
