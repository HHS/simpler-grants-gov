import pytest

from src.db.models.opportunity_models import Opportunity
from src.services.opportunities_v1.get_opportunities import (
    get_changed_searchable_opportunities,
    get_searchable_opportunities,
)
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import OpportunityChangeAuditFactory, OpportunityFactory


@pytest.fixture(autouse=True)
def clear_opportunities(db_session):
    # Clear opportunities after each test function
    cascade_delete_from_db_table(db_session, Opportunity)


def _opportunity_ids(batches) -> set:
    return {opp.opportunity_id for batch in batches for opp in batch}


def test_get_searchable_opportunities_filters(enable_factory_create, db_session):
    searchable = OpportunityFactory.create_batch(size=3, opportunity_attachments=[])

    # None of these should be returned
    OpportunityFactory.create(is_draft=True, opportunity_attachments=[])
    OpportunityFactory.create(no_current_summary=True, opportunity_attachments=[])

    results = _opportunity_ids(get_searchable_opportunities(db_session))

    assert results == {opp.opportunity_id for opp in searchable}


def test_get_searchable_opportunities_batch(enable_factory_create, db_session):
    OpportunityFactory.create_batch(size=3, opportunity_attachments=[])

    # No batch_size specified returns all opportunities
    no_batch_size_batches = list(get_searchable_opportunities(db_session))
    assert [len(batch) for batch in no_batch_size_batches] == [3]

    # batch_size specified
    with_batch_size_batches = list(get_searchable_opportunities(db_session, batch_size=2))
    assert [len(batch) for batch in with_batch_size_batches] == [2, 1]


def test_get_changed_searchable_opportunities(enable_factory_create, db_session):
    not_loaded = OpportunityFactory.create(opportunity_attachments=[])
    OpportunityChangeAuditFactory.create(opportunity=not_loaded, is_loaded_to_search=False)

    # The change audit trigger inserts rows without setting is_loaded_to_search
    null_loaded = OpportunityFactory.create(opportunity_attachments=[])
    OpportunityChangeAuditFactory.create(opportunity=null_loaded, is_loaded_to_search=None)

    # None of these should be in results
    already_loaded = OpportunityFactory.create(opportunity_attachments=[])
    OpportunityChangeAuditFactory.create(opportunity=already_loaded, is_loaded_to_search=True)

    # no change audit record should not be in results
    OpportunityFactory.create(opportunity_attachments=[])

    # Draft opportunities are not searchable and should not be in results
    draft = OpportunityFactory.create(is_draft=True, opportunity_attachments=[])
    OpportunityChangeAuditFactory.create(opportunity=draft, is_loaded_to_search=False)

    # Must have a current_opportunity_summary
    no_summary = OpportunityFactory.create(no_current_summary=True, opportunity_attachments=[])
    OpportunityChangeAuditFactory.create(opportunity=no_summary, is_loaded_to_search=False)

    results = _opportunity_ids(get_changed_searchable_opportunities(db_session, batch_size=10))

    assert results == {not_loaded.opportunity_id, null_loaded.opportunity_id}
