import uuid

import pytest

from src.constants.lookup_constants import WorkflowEntityType, WorkflowType
from src.workflow.event.workflow_event import WorkflowEntity
from src.workflow.service.workflow_service import get_workflow_entities
from src.workflow.state_persistence.base_state_persistence_model import BaseStatePersistenceModel
from src.workflow.workflow_config import WorkflowConfig
from src.workflow.workflow_errors import EntityNotFound, InvalidEventError
from tests.src.db.models.factories import ApplicationFactory, OpportunityFactory


def build_workflow_config(
    workflow_type: WorkflowType = WorkflowType.INITIAL_PROTOTYPE,
    persistence_model: type[BaseStatePersistenceModel] = BaseStatePersistenceModel,
    entity_types: list[WorkflowEntityType] | None = None,
) -> WorkflowConfig:

    if entity_types is None:
        entity_types = []

    config = WorkflowConfig(
        workflow_type=workflow_type,
        persistence_model=persistence_model,
        entity_types=entity_types,
        approval_mapping={},
    )
    return config


def test_get_workflow_entities_simple_opportunity(db_session, enable_factory_create):

    opportunity = OpportunityFactory.create()

    config = build_workflow_config(entity_types=[WorkflowEntityType.OPPORTUNITY])
    entities = [
        WorkflowEntity(
            entity_type=WorkflowEntityType.OPPORTUNITY, entity_id=opportunity.opportunity_id
        )
    ]

    result = get_workflow_entities(db_session, entities, config)

    assert len(result["opportunities"]) == 1
    assert result["opportunities"][0].opportunity_id == opportunity.opportunity_id

    assert len(result["applications"]) == 0


def test_get_workflow_entities_multiple_opportunity(db_session, enable_factory_create):

    opportunities = OpportunityFactory.create_batch(size=4)

    config = build_workflow_config(entity_types=[WorkflowEntityType.OPPORTUNITY])
    entities = [
        WorkflowEntity(
            entity_type=WorkflowEntityType.OPPORTUNITY, entity_id=opportunity.opportunity_id
        )
        for opportunity in opportunities
    ]

    result = get_workflow_entities(db_session, entities, config)

    assert len(result["opportunities"]) == 4
    assert set(o.opportunity_id for o in result["opportunities"]) == set(
        o.opportunity_id for o in opportunities
    )

    assert len(result["applications"]) == 0


def test_get_workflow_entities_simple_application(db_session, enable_factory_create):
    application = ApplicationFactory.create()

    config = build_workflow_config(entity_types=[WorkflowEntityType.APPLICATION])
    entities = [
        WorkflowEntity(
            entity_type=WorkflowEntityType.APPLICATION, entity_id=application.application_id
        )
    ]

    result = get_workflow_entities(db_session, entities, config)

    assert len(result["opportunities"]) == 0

    assert len(result["applications"]) == 1
    assert result["applications"][0].application_id == application.application_id


def test_get_workflow_entities_multiple_applications(db_session, enable_factory_create):
    applications = ApplicationFactory.create_batch(size=3)

    config = build_workflow_config(entity_types=[WorkflowEntityType.APPLICATION])
    entities = [
        WorkflowEntity(
            entity_type=WorkflowEntityType.APPLICATION, entity_id=application.application_id
        )
        for application in applications
    ]

    result = get_workflow_entities(db_session, entities, config)

    assert len(result["opportunities"]) == 0

    assert len(result["applications"]) == 3
    assert set(a.application_id for a in result["applications"]) == set(
        a.application_id for a in applications
    )


def test_get_workflow_mixed_entity_types(db_session, enable_factory_create):
    application = ApplicationFactory.create()
    opportunity = OpportunityFactory.create()

    config = build_workflow_config(
        entity_types=[WorkflowEntityType.OPPORTUNITY, WorkflowEntityType.APPLICATION]
    )
    entities = [
        WorkflowEntity(
            entity_type=WorkflowEntityType.OPPORTUNITY, entity_id=opportunity.opportunity_id
        ),
        WorkflowEntity(
            entity_type=WorkflowEntityType.APPLICATION, entity_id=application.application_id
        ),
    ]

    result = get_workflow_entities(db_session, entities, config)

    assert len(result["opportunities"]) == 1
    assert result["opportunities"][0].opportunity_id == opportunity.opportunity_id

    assert len(result["applications"]) == 1
    assert result["applications"][0].application_id == application.application_id


def test_get_workflow_entity_not_valid_for_config(db_session, enable_factory_create):

    opportunity = OpportunityFactory.create()
    config = build_workflow_config(entity_types=[WorkflowEntityType.APPLICATION])

    entities = [
        WorkflowEntity(
            entity_type=WorkflowEntityType.OPPORTUNITY, entity_id=opportunity.opportunity_id
        )
    ]

    with pytest.raises(InvalidEventError, match="Entity type is not supported for workflow"):
        get_workflow_entities(db_session, entities, config)


def test_get_workflow_entities_opportunity_missing(db_session, enable_factory_create):
    config = build_workflow_config(entity_types=[WorkflowEntityType.OPPORTUNITY])
    entities = [WorkflowEntity(entity_type=WorkflowEntityType.OPPORTUNITY, entity_id=uuid.uuid4())]

    with pytest.raises(EntityNotFound, match="Opportunity not found"):
        get_workflow_entities(db_session, entities, config)


def test_get_workflow_entities_application_missing(db_session, enable_factory_create):
    config = build_workflow_config(entity_types=[WorkflowEntityType.APPLICATION])
    entities = [WorkflowEntity(entity_type=WorkflowEntityType.APPLICATION, entity_id=uuid.uuid4())]

    with pytest.raises(EntityNotFound, match="Application not found"):
        get_workflow_entities(db_session, entities, config)
