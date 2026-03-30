import uuid

import pytest

from src.constants.lookup_constants import (
    AwardRecommendationStatus,
    AwardSelectionMethod,
    Privilege,
)
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationFactory,
    OpportunityFactory,
)

API_URL = "/alpha/award-recommendations"


####################################
# Fixtures
####################################


@pytest.fixture
def agency(enable_factory_create):
    return AgencyFactory.create()


@pytest.fixture
def opportunity(agency) -> Opportunity:
    return OpportunityFactory.create(agency_code=agency.agency_code)


@pytest.fixture
def award_recommendation(opportunity):
    return AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
        award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
        selection_method_detail="Top ranked applicants",
        additional_info="Some additional info",
        other_key_information="Some key info",
        is_deleted=False,
        review_workflow=None,
        review_workflow_id=None,
    )


####################################
# Happy Path Tests
####################################


class TestGetAwardRecommendation200:

    def test_get_award_recommendation_200(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.get(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.json["data"]

        assert data["award_recommendation_id"] == str(award_recommendation.award_recommendation_id)
        assert (
            data["award_recommendation_number"] == award_recommendation.award_recommendation_number
        )
        assert data["award_recommendation_status"] == AwardRecommendationStatus.DRAFT
        assert data["award_selection_method"] == AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY
        assert data["selection_method_detail"] == "Top ranked applicants"
        assert data["additional_info"] == "Some additional info"
        assert data["other_key_information"] == "Some key info"
        assert data["review_workflow_id"] is None

    def test_get_award_recommendation_includes_opportunity_200(
        self, client, db_session, agency, opportunity, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.get(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        opp_data = resp.json["data"]["opportunity"]

        assert opp_data["opportunity_id"] == str(opportunity.opportunity_id)
        assert opp_data["opportunity_number"] == opportunity.opportunity_number
        assert opp_data["opportunity_title"] == opportunity.opportunity_title

    def test_get_award_recommendation_empty_attachments_and_reviews_200(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.get(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.json["data"]

        assert data["award_recommendation_attachments"] == []
        assert data["award_recommendation_reviews"] == []

    def test_get_award_recommendation_nullable_fields_200(
        self, client, db_session, agency, opportunity
    ):
        ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_selection_method=None,
            selection_method_detail=None,
            additional_info=None,
            other_key_information=None,
            review_workflow=None,
            review_workflow_id=None,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.get(
            f"{API_URL}/{ar.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.json["data"]

        assert data["award_selection_method"] is None
        assert data["selection_method_detail"] is None
        assert data["additional_info"] is None
        assert data["other_key_information"] is None
        assert data["review_workflow_id"] is None


####################################
# 404 Tests
####################################


class TestGetAwardRecommendation404:

    def test_get_award_recommendation_not_found_404(
        self, client, db_session, agency, enable_factory_create
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        non_existent_id = uuid.uuid4()
        resp = client.get(
            f"{API_URL}/{non_existent_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404
        assert (
            f"Could not find Award Recommendation with ID {non_existent_id}" in resp.json["message"]
        )

    def test_get_deleted_award_recommendation_404(self, client, db_session, agency, opportunity):
        ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.get(
            f"{API_URL}/{ar.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404


####################################
# 401 Tests
####################################


class TestGetAwardRecommendation401:

    def test_get_award_recommendation_no_token_401(self, client, enable_factory_create):
        resp = client.get(f"{API_URL}/{uuid.uuid4()}")

        assert resp.status_code == 401
        assert resp.json["message"] == "Unable to process token"

    def test_get_award_recommendation_invalid_token_401(self, client, enable_factory_create):
        resp = client.get(f"{API_URL}/{uuid.uuid4()}", headers={"X-SGG-Token": "invalid-token"})

        assert resp.status_code == 401
        assert resp.json["message"] == "Unable to process token"

    def test_get_award_recommendation_invalid_api_key_401(self, client, enable_factory_create):
        resp = client.get(f"{API_URL}/{uuid.uuid4()}", headers={"X-API-Key": "not-a-key"})

        assert resp.status_code == 401
        assert resp.json["message"] == "Invalid API key"


####################################
# 403 Tests
####################################


class TestGetAwardRecommendation403:

    def test_get_award_recommendation_wrong_agency_403(
        self, client, db_session, award_recommendation, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.get(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_get_award_recommendation_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        resp = client.get(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"
