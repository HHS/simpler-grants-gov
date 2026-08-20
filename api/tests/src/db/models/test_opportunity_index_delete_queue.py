import pytest
from sqlalchemy.exc import IntegrityError

from src.db.models.opportunity_models import OpportunityIndexDeleteQueue
from tests.src.db.models.factories import OpportunityFactory, OpportunityIndexDeleteQueueFactory


class TestOpportunityIndexDeleteQueue:
    def test_factory_creates_queue_record(self, enable_factory_create, db_session):
        queued = OpportunityIndexDeleteQueueFactory.create()

        db_record = db_session.get(OpportunityIndexDeleteQueue, queued.opportunity_id)
        assert db_record is not None
        assert db_record.created_at is not None
        assert db_record.updated_at is not None

    def test_opportunity_id_is_unique(self, enable_factory_create, db_session):
        """The opportunity_id primary key keeps an opportunity from being queued twice"""
        queued = OpportunityIndexDeleteQueueFactory.create()

        with pytest.raises(IntegrityError):
            with db_session.begin():
                OpportunityIndexDeleteQueueFactory.create(opportunity_id=queued.opportunity_id)

    def test_queue_record_outlives_the_opportunity(self, enable_factory_create, db_session):
        """No foreign key to opportunity, so deleting the opportunity leaves the queue row"""
        opportunity = OpportunityFactory.create()
        OpportunityIndexDeleteQueueFactory.create(opportunity_id=opportunity.opportunity_id)

        with db_session.begin():
            db_session.delete(opportunity)

        assert db_session.get(OpportunityIndexDeleteQueue, opportunity.opportunity_id) is not None
