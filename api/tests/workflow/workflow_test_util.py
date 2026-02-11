"""
This file contains various utilities for helping test workflows
including setting up data and validation.
"""

import uuid

from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.workflow.event.workflow_event import (
    ProcessWorkflowEventContext,
    StartWorkflowEventContext,
    WorkflowEntity,
    WorkflowEvent,
)
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel
from src.workflow.workflow_config import WorkflowConfig


def build_workflow_config(
    workflow_type: WorkflowType = WorkflowType.INITIAL_PROTOTYPE,
    persistence_model_cls: type[BaseStatePersistenceModel] = BaseStatePersistenceModel,
    entity_types: list[WorkflowEntityType] | None = None,
) -> WorkflowConfig:
    """Build a workflow config"""

    if entity_types is None:
        entity_types = []

    config = WorkflowConfig(
        workflow_type=workflow_type,
        persistence_model_cls=persistence_model_cls,
        entity_types=entity_types,
        approval_mapping={},
    )
    return config


def build_start_workflow_event(
    workflow_type: WorkflowType,
    user: User | None,
    entities: list,
    exclude_start_workflow_context: bool = False,
) -> WorkflowEvent:
    user_id = user.user_id if user else uuid.uuid4()

    entity_list = []
    for entity in entities:
        if isinstance(entity, Opportunity):
            entity_list.append(
                WorkflowEntity(
                    entity_type=WorkflowEntityType.OPPORTUNITY, entity_id=entity.opportunity_id
                )
            )

    if exclude_start_workflow_context:
        start_workflow_context = None
    else:
        start_workflow_context = StartWorkflowEventContext(
            workflow_type=workflow_type,
            entities=entity_list,
        )

    event = WorkflowEvent(
        event_id=uuid.uuid4(),
        acting_user_id=user_id,
        event_type=WorkflowEventType.START_WORKFLOW,
        start_workflow_context=start_workflow_context,
    )

    return event


def build_process_workflow_event(
    workflow_id: uuid.UUID,
    user: User | None,
    event_to_send: str,
    exclude_process_workflow_context: bool = False,
):
    user_id = user.user_id if user else uuid.uuid4()

    if exclude_process_workflow_context:
        process_workflow_context = None
    else:
        process_workflow_context = ProcessWorkflowEventContext(
            workflow_id=workflow_id, event_to_send=event_to_send
        )

    event = WorkflowEvent(
        event_id=uuid.uuid4(),
        acting_user_id=user_id,
        event_type=WorkflowEventType.PROCESS_WORKFLOW,
        process_workflow_context=process_workflow_context,
    )

    return event
