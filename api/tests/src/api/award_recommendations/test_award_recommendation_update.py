import uuid

import pytest

from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
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
        award_recommendation_status=AwardRecommendationStatus.IN_REVIEW,
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


class TestUpdateAwardRecommendation200:

    def test_update_award_recommendation_200(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION, Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        update_data = {
            "award_selection_method": AwardSelectionMethod.FORMULA.value,
            "additional_info": "Updated additional information",
            "funding_strategy": "Updated funding strategy",
            "selection_method_detail": "Updated selection method details",
            "other_key_information": "Updated key information",
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.json["data"]

        # Assert that fields were updated correctly in response
        assert data["award_recommendation_id"] == str(award_recommendation.award_recommendation_id)
        assert data["award_recommendation_status"] == AwardRecommendationStatus.IN_REVIEW
        assert data["award_selection_method"] == AwardSelectionMethod.FORMULA
        assert data["additional_info"] == "Updated additional information"
        assert data["selection_method_detail"] == "Updated selection method details"
        assert data["funding_strategy"] == "Updated funding strategy"
        assert data["other_key_information"] == "Updated key information"

        # Verify database was actually updated
        db_session.refresh(award_recommendation)
        assert award_recommendation.award_selection_method == AwardSelectionMethod.FORMULA
        assert award_recommendation.additional_info == "Updated additional information"
        assert award_recommendation.selection_method_detail == "Updated selection method details"
        assert award_recommendation.funding_strategy == "Updated funding strategy"
        assert award_recommendation.other_key_information == "Updated key information"

        # Verify an audit record was created for the update
        audit_records = [
            event
            for event in award_recommendation.award_recommendation_audit_events
            if event.award_recommendation_audit_event
            == AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_UPDATED
            and event.user_id == user.user_id
        ]

        assert len(audit_records) > 0, "No audit record was created for the update"
        assert audit_records[-1].created_at is not None, "Audit record timestamp is missing"

    def test_update_award_recommendation_null_fields_200(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION, Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        update_data = {
            "award_selection_method": AwardSelectionMethod.FORMULA.value,
            "additional_info": None,
            "funding_strategy": None,
            "selection_method_detail": None,
            "other_key_information": None,
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.json["data"]

        # Assert that fields were updated correctly with null values in response
        assert data["award_recommendation_id"] == str(award_recommendation.award_recommendation_id)
        assert data["award_selection_method"] == AwardSelectionMethod.FORMULA
        assert data["additional_info"] is None
        assert data["selection_method_detail"] is None
        assert data["funding_strategy"] is None
        assert data["other_key_information"] is None

        # Verify database was actually updated with null values
        db_session.refresh(award_recommendation)
        assert award_recommendation.award_selection_method == AwardSelectionMethod.FORMULA
        assert award_recommendation.additional_info is None
        assert award_recommendation.selection_method_detail is None
        assert award_recommendation.funding_strategy is None
        assert award_recommendation.other_key_information is None

        # Verify an audit record was created for the update
        audit_records = [
            event
            for event in award_recommendation.award_recommendation_audit_events
            if event.award_recommendation_audit_event
            == AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_UPDATED
            and event.user_id == user.user_id
        ]

        assert len(audit_records) > 0, "No audit record was created for the update"
        assert audit_records[-1].created_at is not None, "Audit record timestamp is missing"


####################################
# 422 Tests
####################################


class TestUpdateAwardRecommendation422:

    def test_update_award_recommendation_missing_required_fields_422(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        # Missing required award_selection_method
        update_data = {
            "additional_info": "Updated additional information",
            "funding_strategy": "Updated funding strategy",
            "selection_method_detail": "Updated selection method details",
            "other_key_information": "Updated key information",
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 422


####################################
# 404 Tests
####################################


class TestUpdateAwardRecommendation404:

    def test_update_award_recommendation_not_found_404(self, client, db_session, agency):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION, Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        non_existent_id = uuid.uuid4()
        update_data = {
            "award_selection_method": AwardSelectionMethod.FORMULA.value,
            "additional_info": "Updated additional information",
            "funding_strategy": "Updated funding strategy",
            "selection_method_detail": "Updated selection method details",
            "other_key_information": "Updated key information",
        }

        resp = client.put(
            f"{API_URL}/{non_existent_id}",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404
        assert (
            f"Could not find Award Recommendation with ID {non_existent_id}" in resp.json["message"]
        )

    def test_update_deleted_award_recommendation_404(self, client, db_session, agency, opportunity):
        ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION, Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        update_data = {
            "award_selection_method": AwardSelectionMethod.FORMULA.value,
            "additional_info": "Updated additional information",
            "funding_strategy": "Updated funding strategy",
            "selection_method_detail": "Updated selection method details",
            "other_key_information": "Updated key information",
        }

        resp = client.put(
            f"{API_URL}/{ar.award_recommendation_id}",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404


####################################
# 403 Tests
####################################


class TestUpdateAwardRecommendation403:

    def test_update_award_recommendation_wrong_agency_403(
        self, client, db_session, award_recommendation, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=other_agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION, Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        update_data = {
            "award_selection_method": AwardSelectionMethod.FORMULA.value,
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_update_award_recommendation_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation
    ):
        # Only provide VIEW privilege, but not UPDATE privilege
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        update_data = {
            "award_selection_method": AwardSelectionMethod.FORMULA.value,
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


####################################
# 401 Tests
####################################


class TestUpdateAwardRecommendation401:

    def test_update_award_recommendation_no_token_401(self, client, award_recommendation):
        update_data = {
            "award_selection_method": AwardSelectionMethod.FORMULA.value,
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            json=update_data,
        )

        assert resp.status_code == 401
        assert resp.json["message"] == "Unauthorized"

    def test_update_award_recommendation_invalid_token_401(self, client, award_recommendation):
        update_data = {
            "award_selection_method": AwardSelectionMethod.FORMULA.value,
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            json=update_data,
            headers={"X-SGG-Token": "invalid-token"},
        )

        assert resp.status_code == 401
        assert resp.json["message"] == "Unable to process token"
