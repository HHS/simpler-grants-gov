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
)


@pytest.fixture
def award_recommendation(enable_factory_create):
    return AwardRecommendationFactory.create()


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
