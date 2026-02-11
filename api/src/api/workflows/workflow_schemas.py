from typing import Any

from marshmallow import ValidationError, validates_schema

from src.api.schemas.extension import Schema, fields, validators
from src.api.schemas.extension.schema_common import MarshmallowErrorContainer
from src.api.schemas.response_schema import AbstractResponseSchema
from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType
from src.validation.validation_constants import ValidationErrorType


class WorkflowEntitySchema(Schema):
    entity_type = fields.Enum(WorkflowEntityType, required=True)
    entity_id = fields.UUID(required=True)


class StartWorkflowContextSchema(Schema):
    workflow_type = fields.Enum(WorkflowType, required=True)
    entities = fields.List(fields.Nested(WorkflowEntitySchema), required=True)


class ProcessWorkflowContextSchema(Schema):
    workflow_id = fields.UUID(required=True)
    event_to_send = fields.String(required=True, validate=validators.Length(min=1))


class WorkflowEventRequestSchema(Schema):
    event_type = fields.Enum(WorkflowEventType, required=True)
    start_workflow_context = fields.Nested(StartWorkflowContextSchema, required=False)
    process_workflow_context = fields.Nested(ProcessWorkflowContextSchema, required=False)
    metadata = fields.Dict(required=False, load_default={})

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

            entities = start_ctx.get("entities", [])
            if len(entities) < 1 or len(entities) > 5:
                raise ValidationError(
                    [MarshmallowErrorContainer(ValidationErrorType.INVALID, "maximum length 5")],
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
