import uuid

import pytest

from src.constants.lookup_constants import (
    AwardRecommendationRiskType,
    AwardRecommendationStatus,
    Privilege,
)
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationApplicationSubmissionFactory,
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
        is_deleted=False,
        review_workflow=None,
        review_workflow_id=None,
    )


def _build_request(submission_ids: list[uuid.UUID]) -> dict:
    return {
        "comment": "This applicant has a history of late reporting.",
        "award_recommendation_risk_type": AwardRecommendationRiskType.ADDITIONAL_MONITORING,
        "award_recommendation_application_submission_ids": [str(sid) for sid in submission_ids],
    }


####################################
# 200 Tests
####################################


class TestCreateAwardRecommendationRisk200:

    def test_create_risk_single_submission_200(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        submission_id = submission.award_recommendation_application_submission_id

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request([submission_id]),
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert data["award_recommendation_risk_id"] is not None
        assert data["comment"] == "This applicant has a history of late reporting."
        assert data["award_recommendation_risk_number"] is not None
        assert (
            data["award_recommendation_risk_type"]
            == AwardRecommendationRiskType.ADDITIONAL_MONITORING
        )
        assert len(data["award_recommendation_application_submission_ids"]) == 1
        assert str(submission_id) in data["award_recommendation_application_submission_ids"]

    def test_create_risk_multiple_submissions_200(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        sub1 = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        sub2 = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        sub_ids = [
            sub1.award_recommendation_application_submission_id,
            sub2.award_recommendation_application_submission_id,
        ]

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request(sub_ids),
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        returned_ids = set(data["award_recommendation_application_submission_ids"])
        assert len(returned_ids) == 2
        assert str(sub_ids[0]) in returned_ids
        assert str(sub_ids[1]) in returned_ids

    def test_create_risk_number_has_agency_prefix(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request([submission.award_recommendation_application_submission_id]),
        )

        assert resp.status_code == 200
        risk_number = resp.json["data"]["award_recommendation_risk_number"]
        assert risk_number.startswith(agency.agency_code)


####################################
# 404 Tests
####################################


class TestCreateAwardRecommendationRisk404:

    def test_create_risk_ar_not_found_404(self, client, db_session, agency, enable_factory_create):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 404

    def test_create_risk_ar_deleted_404(
        self, client, db_session, agency, opportunity, enable_factory_create
    ):
        deleted_ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{deleted_ar.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 404

    def test_create_risk_submission_not_found_404(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 404

    def test_create_risk_submission_from_different_ar_404(
        self, client, db_session, agency, opportunity, award_recommendation
    ):
        other_ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            review_workflow=None,
            review_workflow_id=None,
        )
        submission_on_other_ar = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=other_ar,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request(
                [submission_on_other_ar.award_recommendation_application_submission_id]
            ),
        )

        assert resp.status_code == 404


####################################
# 401 Tests
####################################


class TestCreateAwardRecommendationRisk401:

    def test_create_risk_no_token_401(self, client, enable_factory_create):
        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/risks",
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 401

    def test_create_risk_invalid_token_401(self, client, enable_factory_create):
        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/risks",
            headers={"X-SGG-Token": "invalid-token"},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestCreateAwardRecommendationRisk403:

    def test_create_risk_wrong_agency_403(
        self, client, db_session, award_recommendation, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request([submission.award_recommendation_application_submission_id]),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_create_risk_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json=_build_request([submission.award_recommendation_application_submission_id]),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


####################################
# 422 Tests
####################################


class TestCreateAwardRecommendationRisk422:

    def test_create_risk_missing_comment_422(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json={
                "award_recommendation_risk_type": AwardRecommendationRiskType.ADDITIONAL_MONITORING,
                "award_recommendation_application_submission_ids": [str(uuid.uuid4())],
            },
        )

        assert resp.status_code == 422

    def test_create_risk_invalid_enum_422(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json={
                "comment": "Some risk",
                "award_recommendation_risk_type": "not_a_real_type",
                "award_recommendation_application_submission_ids": [str(uuid.uuid4())],
            },
        )

        assert resp.status_code == 422

    def test_create_risk_missing_submissions_422(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks",
            headers={"X-SGG-Token": token},
            json={
                "comment": "Some risk",
                "award_recommendation_risk_type": AwardRecommendationRiskType.ADDITIONAL_MONITORING,
            },
        )

        assert resp.status_code == 422
