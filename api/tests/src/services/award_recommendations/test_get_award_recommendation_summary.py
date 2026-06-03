import time
from decimal import Decimal

import pytest

from src.services.award_recommendations.award_recommendation_summary_data import (
    AwardRecommendationSummaryData,
)
from src.services.award_recommendations.get_award_recommendation_summary import (
    get_award_recommendation_summary,
)
from tests.src.db.models.factories import (
    AwardRecommendationApplicationSubmissionFactory,
    AwardRecommendationFactory,
    OpportunityFactory,
)

# If this query exceeds 100ms at scale, consider moving summary to a dedicated endpoint
# so GET /award-recommendations/:id stays fast for callers that do not need it.
LARGE_SUBMISSION_COUNT = 1000
MAX_SUMMARY_QUERY_SECONDS = 0.1


@pytest.fixture
def award_recommendation(enable_factory_create):
    opportunity = OpportunityFactory.create()
    return AwardRecommendationFactory.create(opportunity=opportunity)


class TestGetAwardRecommendationSummary:

    def test_returns_dataclass_with_aggregated_values(self, db_session, award_recommendation):
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
            recommended_for_funding=True,
        )
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
            not_recommended=True,
        )

        result = get_award_recommendation_summary(
            db_session, award_recommendation.award_recommendation_id
        )

        assert isinstance(result, AwardRecommendationSummaryData)
        assert result.total_received_count == 2
        assert result.recommended_for_funding_count == 1
        assert result.not_recommended_count == 1

    def test_returns_zeros_when_no_submissions(self, db_session, award_recommendation):
        result = get_award_recommendation_summary(
            db_session, award_recommendation.award_recommendation_id
        )

        assert result.total_received_count == 0
        assert result.recommended_for_funding_count == 0
        assert result.recommended_without_funding_count == 0
        assert result.not_recommended_count == 0
        assert result.total_recommended_amount == Decimal("0")


class TestGetAwardRecommendationSummaryPerformance:

    def test_summary_query_completes_within_threshold_for_many_submissions(
        self, db_session, award_recommendation
    ):
        AwardRecommendationApplicationSubmissionFactory.create_batch(
            LARGE_SUBMISSION_COUNT,
            award_recommendation=award_recommendation,
            recommended_for_funding=True,
        )
        db_session.flush()

        start = time.perf_counter()
        result = get_award_recommendation_summary(
            db_session, award_recommendation.award_recommendation_id
        )
        elapsed = time.perf_counter() - start

        assert result.total_received_count == LARGE_SUBMISSION_COUNT
        assert result.recommended_for_funding_count == LARGE_SUBMISSION_COUNT
        assert elapsed < MAX_SUMMARY_QUERY_SECONDS, (
            f"Summary query took {elapsed:.3f}s for {LARGE_SUBMISSION_COUNT} submissions; "
            "consider a dedicated summary endpoint if this exceeds 100ms in production."
        )
