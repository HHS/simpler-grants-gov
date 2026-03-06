"""
This file contains various utilities for helping test workflows
including setting up data and validation.
"""

import uuid
from typing import Any

from src.adapters import db
from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.db.models.workflow_models import WorkflowApproval, WorkflowEventHistory
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.workflow_event import (
    ProcessWorkflowEventContext,
    StartWorkflowEventContext,
    WorkflowEvent,
)
from src.workflow.handler.event_handler import EventHandler
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel
from src.workflow.workflow_config import WorkflowConfig
from tests.src.db.models.factories import WorkflowEventHistoryFactory


def build_workflow_config(
    workflow_type: WorkflowType = WorkflowType.INITIAL_PROTOTYPE,
    persistence_model_cls: type[BaseStatePersistenceModel] = BaseStatePersistenceModel,
    entity_type: WorkflowEntityType = WorkflowEntityType.OPPORTUNITY,
) -> WorkflowConfig:
    """Build a workflow config"""

    config = WorkflowConfig(
        workflow_type=workflow_type,
        persistence_model_cls=persistence_model_cls,
        entity_type=entity_type,
        approval_mapping={},
    )
    return config


def build_start_workflow_event(
    workflow_type: WorkflowType,
    user: User | None,
    entity,
    exclude_start_workflow_context: bool = False,
) -> tuple[WorkflowEvent, WorkflowEventHistory]:
    user_id = user.user_id if user else uuid.uuid4()

    if isinstance(entity, Opportunity):
        entity_type = WorkflowEntityType.OPPORTUNITY
        entity_id = entity.opportunity_id
    else:
        raise NotImplementedError(
            f"Haven't yet configured this function for entity type {type(entity)}"
        )

    if exclude_start_workflow_context:
        start_workflow_context = None
    else:
        start_workflow_context = StartWorkflowEventContext(
            workflow_type=workflow_type,
            entity_type=entity_type,
            entity_id=entity_id,
        )

    event = WorkflowEvent(
        event_id=uuid.uuid4(),
        acting_user_id=user_id,
        event_type=WorkflowEventType.START_WORKFLOW,
        start_workflow_context=start_workflow_context,
    )

    workflow_event_history = WorkflowEventHistoryFactory.create(
        event_id=event.event_id,
        event_data=event.model_dump_json(),
        workflow_id=None,
        workflow=None,
    )

    return event, workflow_event_history


def build_process_workflow_event(
    workflow_id: uuid.UUID,
    user: User | None,
    event_to_send: str,
    metadata: dict | None = None,
    exclude_process_workflow_context: bool = False,
) -> tuple[WorkflowEvent, WorkflowEventHistory]:
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
        metadata=metadata,
    )

    workflow_event_history = WorkflowEventHistoryFactory.create(
        event_id=event.event_id,
        event_data=event.model_dump_json(),
        # Despite having the workflow, we don't attach it here
        # as that wouldn't be connected until the event handler processes it.
        workflow_id=None,
        workflow=None,
    )

    return event, workflow_event_history


def send_process_event(
    db_session: db.Session,
    event_to_send: str,
    workflow_id: uuid.UUID,
    user: User,
    expected_state: str,
    expected_is_active: bool = True,
    approval_response_type: str | None = None,
    comment: str | None = None,
) -> BaseStateMachine:

    metadata = {}
    if approval_response_type is not None:
        metadata["approval_response_type"] = approval_response_type
    if comment is not None:
        metadata["comment"] = comment

    # Don't include an empty metadata
    if len(metadata) == 0:
        metadata = None

    process_workflow_event, history_event = build_process_workflow_event(
        workflow_id=workflow_id,
        user=user,
        event_to_send=event_to_send,
        metadata=metadata,
    )

    state_machine = EventHandler(db_session, process_workflow_event, history_event).process()
    assert (
        state_machine.workflow.current_workflow_state == expected_state
    ), f"Expected {expected_state} but got {state_machine.workflow.current_workflow_state}"
    assert state_machine.workflow.is_active == expected_is_active

    return state_machine


def validate_approvals(
    state_machine: BaseStateMachine, expected_approvals: list[dict[str, Any] | WorkflowApproval]
) -> None:
    """Utility function to validate the approvals.

    For expected_approvals, pass in a list of dicts/WorkflowApproval objects of the format

    {
      "approving_user_id": user.user_id,
      "approval_type": ApprovalType.X,
      "is_still_valid": True/False
      "approval_response_type": ApprovalResponseType.X,
      "comment": "hello",
    }

    If a field is excluded, it will not be checked (useful to skip over dummy test data)
    The length of the approvals must however match in the order they were created.
    """

    approvals = sorted(
        state_machine.workflow.workflow_approvals, key=lambda approval: approval.created_at
    )
    assert len(approvals) == len(expected_approvals)

    for approval, expected_approval in zip(approvals, expected_approvals, strict=True):

        # If we passed in an approval object, just check the IDs
        # to verify it's in the right spot
        if isinstance(expected_approval, WorkflowApproval):
            assert approval.workflow_approval_id == expected_approval.workflow_approval_id
        else:
            # Only compare the fields that were passed in
            for field, value in expected_approval.items():
                assert (
                    getattr(approval, field) == value
                ), f"Values do not match for approval for field {field}"
