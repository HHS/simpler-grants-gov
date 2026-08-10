import pytest

from src.constants.lookup_constants import WorkflowType
from src.workflow.state_persistence.opportunity_persistence_model import OpportunityPersistenceModel
from src.workflow.workflow_errors import InvalidEntityForWorkflow
from tests.src.db.models.factories import ApplicationFactory, OpportunityFactory, WorkflowFactory


def test_opportunity_persistence_model(db_session, enable_factory_create):
    opportunity = OpportunityFactory.create()

    workflow = WorkflowFactory.create(opportunity=opportunity)

    model = OpportunityPersistenceModel(db_session, workflow)
    assert model.opportunity.opportunity_id == opportunity.opportunity_id
    assert model.state == "start"


def test_opportunity_persistence_no_opportunity(
    db_session,
    enable_factory_create,
):
    application = ApplicationFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        application=application,
    )

    with pytest.raises(
        InvalidEntityForWorkflow,
        match="Expected the workflow entity to be an opportunity",
    ):
        OpportunityPersistenceModel(
            db_session=db_session,
            workflow=workflow,
        )
