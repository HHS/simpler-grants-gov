import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn

from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.opportunity_models import Opportunity


class Workflow(ApiSchemaTable, TimestampMixin):
    __tablename__ = "workflow"

    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    workflow_type: Mapped[str] # Note this should be a LK value
    current_workflow_state: Mapped[str] # Note - this might be an LK value

    is_active: Mapped[bool] = mapped_column(default=True)

    # TODO - not sure exactly how we want to connect the workflow
    # to a specific entity. If we end up with needing to support
    # half a dozen entity types (opportunity, submission, and more)
    # then this is going to be clunky to work with. Is there a better pattern?
    # Need to investigate potential patterns here.
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(UUID, ForeignKey(Opportunity.opportunity_id), index=True)
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    workflow_audits: Mapped[list[WorkflowAudit]] = relationship(
        "WorkflowAudit",
        back_populates="workflow",
        uselist=True,
        cascade="all, delete-orphan",
    )

class WorkflowAudit(ApiSchemaTable, TimestampMixin):
    __tablename__ = "workflow_audit"

    workflow_audit_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Workflow.workflow_id), index=True)
    workflow: Mapped[Workflow] = relationship(Workflow)

    user_id: Mapped[str | None] # This would actually be a foreign key to the user table

    transition_event: Mapped[str]
    source_state: Mapped[str]
    target_state: Mapped[str]
