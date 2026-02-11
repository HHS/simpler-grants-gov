from typing import Any

from marshmallow import ValidationError, validates_schema

from src.api.schemas.extension import Schema, fields, validators
from src.api.schemas.extension.schema_common import MarshmallowErrorContainer
from src.api.schemas.response_schema import AbstractResponseSchema
from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType
from src.validation.validation_constants import ValidationErrorType


class WorkflowEntitySchema(Schema):
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


class StartWorkflowContextSchema(Schema):
    workflow_type = fields.Enum(
        WorkflowType, required=True, metadata={"description": "The type of workflow to initiate"}
    )
    entities = fields.List(
        fields.Nested(WorkflowEntitySchema),
        required=True,
        validate=[validators.Length(min=1, max=5, error="maximum length 5")],
        metadata={
            "description": "A list of entities (1-5) to associate with the workflow.",
            "example": [
                {"entity_type": "opportunity", "entity_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"}
            ],
        },
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
            "description": "Context and entities required to initialize a new workflow. Only allowed if event_type is 'start_workflow'.",
            "example": {
                "workflow_type": "opportunity_publish",
                "entities": [
                    {
                        "entity_type": "opportunity",
                        "entity_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    }
                ],
            },
        },
    )
    process_workflow_context = fields.Nested(
        ProcessWorkflowContextSchema,
        required=False,
        metadata={
            "description": "Information required to progress an existing workflow state. Only allowed if event_type is 'process_workflow'.",
            "example": {
                "workflow_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "event_to_send": "approve",
            },
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
