import pytest

from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_errors import InvalidEntityForWorkflow
from tests.src.db.models.factories import OpportunityFactory, WorkflowFactory


def test_opportunity_persistence_model(db_session, enable_factory_create):
    opportunity = OpportunityFactory.create()

    workflow = WorkflowFactory.create(opportunity=opportunity)

    model = OpportunityPersistenceModel(db_session, workflow)
    assert model.opportunity.opportunity_id == opportunity.opportunity_id
    assert model.state == "start"


def test_opportunity_persistence_no_opportunity(db_session, enable_factory_create):
    workflow = WorkflowFactory.create(has_application=True)

    with pytest.raises(
        InvalidEntityForWorkflow, match="Expected the workflow entity to be an opportunity"
    ):
        OpportunityPersistenceModel(db_session, workflow)
