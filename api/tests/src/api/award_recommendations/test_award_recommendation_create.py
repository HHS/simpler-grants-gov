import uuid
from decimal import Decimal

import pytest

from src.constants.lookup_constants import (
    AwardRecommendationReviewType,
    AwardRecommendationStatus,
    AwardRecommendationType,
    AwardSelectionMethod,
    Privilege,
)
from src.db.models.award_recommendation_models import AwardRecommendationApplicationSubmission
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    OpportunityFactory,
)

API_URL = "/alpha/award-recommendations"


@pytest.fixture
def agency(enable_factory_create):
    return AgencyFactory.create()


@pytest.fixture
def opportunity(agency) -> Opportunity:
    return OpportunityFactory.create(agency_code=agency.agency_code)


class TestCreateAwardRecommendation200:

    def test_create_award_recommendation_200(self, client, db_session, agency, opportunity):
        competition_1 = CompetitionFactory.create(opportunity=opportunity)
        competition_2 = CompetitionFactory.create(opportunity=opportunity)
        first_application = ApplicationFactory.create(competition=competition_1)
        second_application = ApplicationFactory.create(competition=competition_2)

        ApplicationSubmissionFactory.create(
            application=first_application,
            total_requested_amount=Decimal("1000.00"),
        )
        ApplicationSubmissionFactory.create(
            application=second_application,
            total_requested_amount=Decimal("2000.00"),
        )

        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.CREATE_AWARD_RECOMMENDATION],
        )

        json_data = {
            "opportunity_id": str(opportunity.opportunity_id),
            "award_selection_method": AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY.value,
            "additional_info": "Supporting materials reviewed",
            "funding_strategy": "Allocate across two grants",
            "selection_method_detail": "Merit review panel scores",
            "other_key_information": "Priority funding for rural proposals",
        }

        resp = client.post(
            API_URL,
            json=json_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.json["data"]

        assert data["award_recommendation_status"] == AwardRecommendationStatus.IN_REVIEW
        assert data["award_selection_method"] == AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY
        assert data["additional_info"] == "Supporting materials reviewed"
        assert data["other_key_information"] == "Priority funding for rural proposals"
        assert data["opportunity"]["opportunity_id"] == str(opportunity.opportunity_id)
        assert data["award_recommendation_number"].startswith(agency.agency_code)
        assert len(data["award_recommendation_number"]) == len(agency.agency_code) + 10

        assert len(data["award_recommendation_reviews"]) == len(AwardRecommendationReviewType)
        assert all(
            review["is_reviewed"] is False for review in data["award_recommendation_reviews"]
        )

        linked = (
            db_session.query(AwardRecommendationApplicationSubmission)
            .filter_by(award_recommendation_id=uuid.UUID(data["award_recommendation_id"]))
            .all()
        )
        assert len(linked) == 2

        for link in linked:
            detail = link.award_recommendation_submission_detail
            assert detail.award_recommendation_type == AwardRecommendationType.NOT_RECOMMENDED
            assert detail.recommended_amount in (Decimal("1000.00"), Decimal("2000.00"))
            assert 1 <= int(detail.scoring_comment) <= 100


class TestCreateAwardRecommendation422:

    def test_create_award_recommendation_missing_required_fields_422(
        self, client, db_session, agency, opportunity
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.CREATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            json={
                "opportunity_id": str(opportunity.opportunity_id),
            },
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 422


class TestCreateAwardRecommendation404:

    def test_create_award_recommendation_opportunity_not_found_404(
        self, client, db_session, agency
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.CREATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            json={
                "opportunity_id": str(uuid.uuid4()),
                "award_selection_method": AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY.value,
            },
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404
        assert "Could not find Opportunity" in resp.json["message"]


class TestCreateAwardRecommendation403:

    def test_create_award_recommendation_opportunity_without_agency_403(
        self, client, db_session, enable_factory_create
    ):
        opportunity = OpportunityFactory.create(agency_record=None)

        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            privileges=[Privilege.CREATE_AWARD_RECOMMENDATION],
        )

        resp = client.post(
            API_URL,
            json={
                "opportunity_id": str(opportunity.opportunity_id),
                "award_selection_method": AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY.value,
            },
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_create_award_recommendation_wrong_agency_403(
        self, client, db_session, agency, opportunity
    ):
        other_agency = AgencyFactory.create()
        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=other_agency,
            privileges=[Privilege.CREATE_AWARD_RECOMMENDATION],
        )

        resp = client.post(
            API_URL,
            json={
                "opportunity_id": str(opportunity.opportunity_id),
                "award_selection_method": AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY.value,
            },
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_create_award_recommendation_wrong_privilege_403(
        self, client, db_session, agency, opportunity
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        resp = client.post(
            API_URL,
            json={
                "opportunity_id": str(opportunity.opportunity_id),
                "award_selection_method": AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY.value,
            },
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"
