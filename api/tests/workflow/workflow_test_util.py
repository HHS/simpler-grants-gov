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
    workflow_type: WorkflowType | str,
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
        # In order to make tests a bit easier to setup and allow
        # us to define different workflow types just for tests
        # we pass in a random workflow type, and then assign
        # the value directly. Pydantic by default does not validate
        # type on assignment, so this hacky approach works around
        # a lot of effort to break type checking elsewhere.
        # https://docs.pydantic.dev/latest/api/config/#pydantic.config.ConfigDict.validate_assignment
        start_workflow_context = StartWorkflowEventContext(
            workflow_type=WorkflowType.INITIAL_PROTOTYPE,
            entities=entity_list,
        )
        start_workflow_context.workflow_type = workflow_type

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
):
    user_id = user.user_id if user else uuid.uuid4()

    event = WorkflowEvent(
        event_id=uuid.uuid4(),
        acting_user_id=user_id,
        event_type=WorkflowEventType.PROCESS_WORKFLOW,
        process_workflow_context=ProcessWorkflowEventContext(
            workflow_id=workflow_id, event_to_send=event_to_send
        ),
    )

    return event
