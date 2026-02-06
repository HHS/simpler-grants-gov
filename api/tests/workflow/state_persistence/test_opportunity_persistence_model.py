import uuid

import pytest

from src.workflow.state_persistence.base_state_persistence_model import Workflow
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_errors import InvalidEntityForWorkflow
from tests.src.db.models.factories import OpportunityFactory


def test_opportunity_persistence_model(db_session, enable_factory_create):
    opportunity = OpportunityFactory.create()
    workflow = Workflow(
        workflow_id=uuid.uuid4(),
        workflow_type="whatever",
        current_workflow_state="start",
        is_active=True,
        opportunities=[opportunity],
    )

    model = OpportunityPersistenceModel(db_session, workflow)
    assert model.opportunity.opportunity_id == opportunity.opportunity_id
    assert model.state == "start"


def test_opportunity_persistence_no_opportunity(db_session, enable_factory_create):

    workflow = Workflow(
        workflow_id=uuid.uuid4(),
        workflow_type="whatever",
        current_workflow_state="start",
        is_active=True,
        opportunities=[],
    )

    with pytest.raises(
        InvalidEntityForWorkflow, match="Expected only a single opportunity for workflow"
    ):
        OpportunityPersistenceModel(db_session, workflow)


def test_opportunity_persistence_multiple_opportunity(db_session, enable_factory_create):

    workflow = Workflow(
        workflow_id=uuid.uuid4(),
        workflow_type="whatever",
        current_workflow_state="start",
        is_active=True,
        opportunities=OpportunityFactory.create_batch(size=2),
    )

    with pytest.raises(
        InvalidEntityForWorkflow, match="Expected only a single opportunity for workflow"
    ):
        OpportunityPersistenceModel(db_session, workflow)
