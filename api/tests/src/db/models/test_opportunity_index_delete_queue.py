from src.db.models.opportunity_models import OpportunityIndexDeleteQueue
from tests.src.db.models.factories import OpportunityFactory, OpportunityIndexDeleteQueueFactory


class TestOpportunityIndexDeleteQueue:
    def test_queue_record_outlives_the_opportunity(self, enable_factory_create, db_session):
        """No foreign key to opportunity, so deleting the opportunity leaves the queue row"""
        opportunity = OpportunityFactory.create()
        OpportunityIndexDeleteQueueFactory.create(opportunity_id=opportunity.opportunity_id)

        with db_session.begin():
            db_session.delete(opportunity)

        assert db_session.get(OpportunityIndexDeleteQueue, opportunity.opportunity_id) is not None
