import uuid
from typing import Any

from pydantic import BaseModel

from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType


class StartWorkflowEventContext(BaseModel):
    workflow_type: WorkflowType
    entity_type: WorkflowEntityType
    entity_id: uuid.UUID


class ProcessWorkflowEventContext(BaseModel):
    workflow_id: uuid.UUID
    event_to_send: str


class WorkflowEvent(BaseModel):
    """An event representing what we send over SQS
    for starting/processing a workflow.
    """

    event_id: uuid.UUID
    acting_user_id: uuid.UUID

    event_type: WorkflowEventType

    start_workflow_context: StartWorkflowEventContext | None = None
    process_workflow_context: ProcessWorkflowEventContext | None = None
    metadata: dict | None = None

    def get_log_extra(self) -> dict[str, Any]:
        log_extra = {
            "event_id": self.event_id,
            "acting_user_id": self.acting_user_id,
            "event_type": self.event_type,
        }
        if self.start_workflow_context is not None:
            log_extra |= {
                "workflow_type": self.start_workflow_context.workflow_type,
                "entity_type": self.start_workflow_context.entity_type,
                "entity_id": self.start_workflow_context.entity_id,
            }
        if self.process_workflow_context is not None:
            log_extra |= {
                "workflow_id": self.process_workflow_context.workflow_id,
                "event_to_send": self.process_workflow_context.event_to_send,
            }

        return log_extra
