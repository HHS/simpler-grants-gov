import pytest

from src.db.models.foreign.opportunity import VOpportunitySummary
from src.db.models.opportunity_models import ExcludedOpportunityReview
from src.task.opportunities.sync_opportunity_review_status_task import SyncOpportunityReviewStatus
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import ForeignVopportunitySummaryFactory


@pytest.fixture(autouse=True)
def clear_data(db_session):
    cascade_delete_from_db_table(db_session, ExcludedOpportunityReview)
    cascade_delete_from_db_table(db_session, VOpportunitySummary)


def test_sync_opportunity_review_status(db_session, test_api_schema, enable_factory_create):
    """
    Test that SyncOpportunityReviewStatus correctly identifies and stores
    opportunities with 'REVIEWABLE' and 'RETURNED' statuses in the
    excluded_opportunity_review table.
    """
    # create opportunities in review status
    reviewable = ForeignVopportunitySummaryFactory.create(omb_review_status_display="REVIEWABLE")
    returned = ForeignVopportunitySummaryFactory.create(omb_review_status_display="RETURNED")

    # create opportunities with different status
    ForeignVopportunitySummaryFactory.create(omb_review_status_display="APPROVED")
    ForeignVopportunitySummaryFactory.create(omb_review_status_display="N/A")
    ForeignVopportunitySummaryFactory.create()

    task = SyncOpportunityReviewStatus(db_session, test_api_schema)
    task.run()

    metrics = task.metrics

    assert metrics[task.Metrics.OPPORTUNITIES_IN_REVIEW] == 2

    result = db_session.query(ExcludedOpportunityReview).all()

    assert len(result) == 2
    assert set(opp.legacy_opportunity_id for opp in result) == {
        reviewable.opportunity_id,
        returned.opportunity_id,
    }


def test_sync_opportunity_review_status_empty_result(
    db_session, test_api_schema, enable_factory_create
):
    """Test behavior when no opportunities match the review status criteria."""
    ForeignVopportunitySummaryFactory.create(omb_review_status_display="APPROVED")

    task = SyncOpportunityReviewStatus(db_session, test_api_schema)
    task.run()

    result = db_session.query(ExcludedOpportunityReview).all()
    assert len(result) == 0
    assert task.metrics[task.Metrics.OPPORTUNITIES_IN_REVIEW] == 0
