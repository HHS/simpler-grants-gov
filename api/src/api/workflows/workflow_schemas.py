from typing import Any

from marshmallow import ValidationError, pre_dump, validates_schema

from src.api.schemas.extension import Schema, fields, validators
from src.api.schemas.extension.schema_common import MarshmallowErrorContainer
from src.api.schemas.response_schema import AbstractResponseSchema
from src.constants.lookup_constants import (
    ApprovalResponseType,
    ApprovalType,
    Privilege,
    WorkflowEntityType,
    WorkflowEventType,
    WorkflowType,
)
from src.db.models.user_models import User
from src.validation.validation_constants import ValidationErrorType


class StartWorkflowContextSchema(Schema):
    workflow_type = fields.Enum(
        WorkflowType, required=True, metadata={"description": "The type of workflow to initiate"}
    )
    entity_type = fields.Enum(
        WorkflowEntityType,
        required=True,
        metadata={
            "description": "The type of entity to associate with the workflow - different workflows require different entities."
        },
    )
    entity_id = fields.UUID(
        required=True,
        metadata={"description": "The ID of the entity, for example an opportunity_id"},
    )


class ProcessWorkflowContextSchema(Schema):
    workflow_id = fields.UUID(
        required=True, metadata={"description": "The ID of the existing workflow to progress"}
    )
    event_to_send = fields.String(
        required=True,
        validate=validators.Length(min=1),
        metadata={
            "description": "The specific event/action to trigger in the state machine",
            "example": "approve",
        },
    )


class WorkflowEventRequestSchema(Schema):
    event_type = fields.Enum(
        WorkflowEventType,
        required=True,
        metadata={
            "description": "The category of event: either starting a new workflow or processing an existing one"
        },
    )
    start_workflow_context = fields.Nested(
        StartWorkflowContextSchema,
        required=False,
        metadata={
            "description": "Context and entities required to initialize a new workflow. Only allowed if event_type is 'start_workflow'."
        },
    )
    process_workflow_context = fields.Nested(
        ProcessWorkflowContextSchema,
        required=False,
        metadata={
            "description": "Information required to progress an existing workflow state. Only allowed if event_type is 'process_workflow'."
        },
    )
    metadata = fields.Dict(
        required=False,
        load_default={},
        metadata={
            "description": "A freeform JSON object for the particular event, if needed[cite: 127].",
            "example": {"source_system": "grants_solutions", "priority": "high"},
        },
    )

    @validates_schema
    def validate_context(self, data: dict[str, Any], **kwargs: Any) -> None:
        event_type = data.get("event_type")
        start_ctx = data.get("start_workflow_context")
        process_ctx = data.get("process_workflow_context")

        if event_type == WorkflowEventType.START_WORKFLOW:
            if not start_ctx:
                raise ValidationError(
                    [
                        MarshmallowErrorContainer(
                            ValidationErrorType.REQUIRED, "start_workflow_context is required"
                        )
                    ],
                    "start_workflow_context",
                )

            if process_ctx:
                raise ValidationError(
                    [
                        MarshmallowErrorContainer(
                            ValidationErrorType.INVALID,
                            "process_workflow_context should not be provided",
                        )
                    ],
                    "process_workflow_context",
                )

        if event_type == WorkflowEventType.PROCESS_WORKFLOW:
            if not process_ctx:
                raise ValidationError(
                    [
                        MarshmallowErrorContainer(
                            ValidationErrorType.REQUIRED, "process_workflow_context is required"
                        )
                    ],
                    "process_workflow_context",
                )
            if start_ctx:
                raise ValidationError(
                    [
                        MarshmallowErrorContainer(
                            ValidationErrorType.INVALID,
                            "start_workflow_context should not be provided",
                        )
                    ],
                    "start_workflow_context",
                )


class WorkflowEventResponseDataSchema(Schema):
    event_id = fields.UUID(metadata={"description": "The tracking ID for the workflow event"})


class WorkflowEventResponseSchema(AbstractResponseSchema):
    data = fields.Nested(WorkflowEventResponseDataSchema)


class WorkflowUserSchema(Schema):
    """Simplified user representation for workflow responses."""

    user_id = fields.UUID(metadata={"description": "The user's unique identifier"})
    email = fields.String(
        allow_none=True,
        metadata={"description": "The user's email address", "example": "user@example.com"},
    )
    first_name = fields.String(
        allow_none=True, metadata={"description": "The user's first name", "example": "John"}
    )
    last_name = fields.String(
        allow_none=True, metadata={"description": "The user's last name", "example": "Smith"}
    )

    @pre_dump
    def extract_user_fields(self, user: User, **kwargs: Any) -> dict:
        """Extract user fields from User model using properties."""
        return {
            "user_id": user.user_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }


class WorkflowAuditEventSchema(Schema):
    """Audit event details for workflow state transitions."""

    workflow_audit_id = fields.UUID(metadata={"description": "The audit event's unique identifier"})
    acting_user = fields.Nested(
        WorkflowUserSchema, metadata={"description": "The user who triggered the transition"}
    )
    transition_event = fields.String(
        metadata={
            "description": "The event that triggered the state transition",
            "example": "approve",
        }
    )
    source_state = fields.String(
        metadata={"description": "The state before the transition", "example": "pending_review"}
    )
    target_state = fields.String(
        metadata={"description": "The state after the transition", "example": "approved"}
    )
    event_id = fields.UUID(metadata={"description": "The workflow event that triggered this audit"})
    audit_metadata = fields.Dict(
        allow_none=True,
        metadata={
            "description": "Additional metadata about the audit event",
            "example": {"comment": "Looks good"},
        },
    )
    created_at = fields.DateTime(metadata={"description": "When the audit event was created"})


class WorkflowApprovalSchema(Schema):
    """Approval details for workflow approvals."""

    workflow_approval_id = fields.UUID(
        metadata={"description": "The workflow approval's unique identifier"}
    )
    approving_user = fields.Nested(
        WorkflowUserSchema, metadata={"description": "The user who provided the approval"}
    )
    event_id = fields.UUID(
        metadata={"description": "The workflow event that created this approval"}
    )
    is_still_valid = fields.Boolean(
        metadata={
            "description": "Whether this approval is still valid or has been invalidated",
            "example": True,
        }
    )
    comment = fields.String(
        allow_none=True,
        metadata={
            "description": "Optional comment from the approver",
            "example": "Approved with conditions",
        },
    )
    approval_type = fields.Enum(
        ApprovalType,
        metadata={
            "description": "The type of approval",
            "example": ApprovalType.PROGRAM_OFFICER_APPROVAL,
        },
    )
    approval_response_type = fields.Enum(
        ApprovalResponseType,
        metadata={
            "description": "The response type of the approval",
            "example": ApprovalResponseType.APPROVED,
        },
    )
    created_at = fields.DateTime(metadata={"description": "When the approval was created"})


class WorkflowApprovalConfigItemSchema(Schema):
    """Configuration for a single approval event type."""

    approval_type = fields.Enum(
        ApprovalType,
        metadata={
            "description": "The type of approval required",
            "example": ApprovalType.PROGRAM_OFFICER_APPROVAL,
        },
    )
    required_privileges = fields.List(
        fields.Enum(Privilege),
        metadata={
            "description": "List of privileges required to provide this approval",
            "example": [Privilege.PROGRAM_OFFICER_APPROVAL],
        },
    )
    possible_users = fields.List(
        fields.Nested(WorkflowUserSchema),
        metadata={
            "description": "List of users in the workflow's agency who have the required privileges"
        },
    )


class WorkflowGetResponseDataSchema(Schema):
    """Complete workflow details including audit history and approval configuration."""

    workflow_id = fields.UUID(metadata={"description": "The workflow's unique identifier"})
    workflow_type = fields.Enum(
        WorkflowType,
        metadata={
            "description": "The type of workflow",
            "example": WorkflowType.OPPORTUNITY_PUBLISH,
        },
    )
    current_workflow_state = fields.String(
        metadata={"description": "The current state in the workflow", "example": "draft"}
    )
    is_active = fields.Boolean(
        metadata={
            "description": "Whether the workflow is active (false when workflow reaches end state)",
            "example": True,
        }
    )
    created_at = fields.DateTime(metadata={"description": "When the workflow was created"})
    updated_at = fields.DateTime(metadata={"description": "When the workflow was last updated"})
    workflow_audit_events = fields.List(
        fields.Nested(WorkflowAuditEventSchema),
        metadata={"description": "Ordered list of audit events (sorted by created_at)"},
    )
    workflow_approvals = fields.List(
        fields.Nested(WorkflowApprovalSchema),
        metadata={"description": "Ordered list of approvals (sorted by created_at)"},
    )
    workflow_approval_config = fields.Dict(
        keys=fields.String(),
        values=fields.Nested(WorkflowApprovalConfigItemSchema),
        metadata={
            "description": "Configuration mapping event names to approval requirements and possible users",
            "example": {
                "receive_program_officer_approval": {
                    "approval_type": "PROGRAM_OFFICER_APPROVAL",
                    "required_privileges": ["PROGRAM_OFFICER_APPROVAL"],
                    "possible_users": [],
                }
            },
        },
    )
    opportunity_id = fields.UUID(
        allow_none=True,
        metadata={"description": "The opportunity ID if this is an opportunity workflow"},
    )
    application_id = fields.UUID(
        allow_none=True,
        metadata={"description": "The application ID if this is an application workflow"},
    )
    application_submission_id = fields.UUID(
        allow_none=True,
        metadata={"description": "The application submission ID if this is a submission workflow"},
    )

    @pre_dump
    def prepare_workflow_data(self, data: dict, **kwargs: Any) -> dict:
        """Sort audit events and approvals by created_at timestamp."""
        # Sort audit events by created_at
        if data.get("workflow_audit_events"):
            data["workflow_audit_events"] = sorted(
                data["workflow_audit_events"], key=lambda x: x.created_at
            )

        # Sort approvals by created_at
        if data.get("workflow_approvals"):
            data["workflow_approvals"] = sorted(
                data["workflow_approvals"], key=lambda x: x.created_at
            )

        return data


class WorkflowGetResponseSchema(AbstractResponseSchema):
    """Response schema for GET /v1/workflows/:workflow_id endpoint."""

    data = fields.Nested(
        WorkflowGetResponseDataSchema,
        metadata={
            "description": "The workflow details with audit history and approval configuration"
        },
    )
