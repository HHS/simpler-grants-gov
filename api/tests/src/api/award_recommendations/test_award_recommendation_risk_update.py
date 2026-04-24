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
    AwardRecommendationRiskFactory,
    AwardRecommendationRiskSubmissionFactory,
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


def _build_url(award_recommendation_id: uuid.UUID, risk_id: uuid.UUID) -> str:
    return f"{API_URL}/{award_recommendation_id}/risks/{risk_id}"


def _build_request(submission_ids: list[uuid.UUID]) -> dict:
    return {
        "comment": "Updated risk comment.",
        "award_recommendation_risk_type": AwardRecommendationRiskType.ADDITIONAL_MONITORING,
        "award_recommendation_application_submission_ids": [str(sid) for sid in submission_ids],
    }


####################################
# 200 Tests
####################################


class TestUpdateAwardRecommendationRisk200:

    def test_update_risk_fields_200(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            comment="Original comment",
            award_recommendation_risk_type=AwardRecommendationRiskType.ADDITIONAL_MONITORING,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=submission,
        )
        sub_id = submission.award_recommendation_application_submission_id

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request([sub_id]),
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert data["comment"] == "Updated risk comment."
        assert (
            data["award_recommendation_risk_type"]
            == AwardRecommendationRiskType.ADDITIONAL_MONITORING
        )
        assert data["award_recommendation_risk_number"] == risk.award_recommendation_risk_number
        assert len(data["award_recommendation_application_submission_ids"]) == 1
        assert str(sub_id) in data["award_recommendation_application_submission_ids"]

    def test_update_risk_add_submission_200(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        sub1 = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        sub2 = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=sub1,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request(
                [
                    sub1.award_recommendation_application_submission_id,
                    sub2.award_recommendation_application_submission_id,
                ]
            ),
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        returned_ids = set(data["award_recommendation_application_submission_ids"])
        assert len(returned_ids) == 2
        assert str(sub1.award_recommendation_application_submission_id) in returned_ids
        assert str(sub2.award_recommendation_application_submission_id) in returned_ids

    def test_update_risk_remove_submission_200(
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
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=sub1,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=sub2,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request([sub1.award_recommendation_application_submission_id]),
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data["award_recommendation_application_submission_ids"]) == 1
        assert (
            str(sub1.award_recommendation_application_submission_id)
            in data["award_recommendation_application_submission_ids"]
        )

    def test_update_risk_replace_submissions_200(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        sub_old = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        sub_new = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=sub_old,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request([sub_new.award_recommendation_application_submission_id]),
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data["award_recommendation_application_submission_ids"]) == 1
        assert (
            str(sub_new.award_recommendation_application_submission_id)
            in data["award_recommendation_application_submission_ids"]
        )
        assert (
            str(sub_old.award_recommendation_application_submission_id)
            not in data["award_recommendation_application_submission_ids"]
        )


####################################
# 404 Tests
####################################


class TestUpdateAwardRecommendationRisk404:

    def test_update_risk_ar_not_found_404(self, client, db_session, agency, enable_factory_create):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.put(
            _build_url(uuid.uuid4(), uuid.uuid4()),
            headers={"X-SGG-Token": token},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 404

    def test_update_risk_ar_deleted_404(
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

        resp = client.put(
            _build_url(deleted_ar.award_recommendation_id, uuid.uuid4()),
            headers={"X-SGG-Token": token},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 404

    def test_update_risk_not_found_404(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.put(
            _build_url(award_recommendation.award_recommendation_id, uuid.uuid4()),
            headers={"X-SGG-Token": token},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 404

    def test_update_risk_deleted_404(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            is_deleted=True,
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request([submission.award_recommendation_application_submission_id]),
        )

        assert resp.status_code == 404

    def test_update_risk_submission_not_found_404(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=submission,
        )

        missing_id = uuid.uuid4()
        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request([missing_id]),
        )

        assert resp.status_code == 404
        resp_json = resp.get_json()
        assert len(resp_json["errors"]) == 1
        assert resp_json["errors"][0]["type"] == "application_submission_not_found"
        assert resp_json["errors"][0]["field"] == "award_recommendation_application_submission_ids"
        assert resp_json["errors"][0]["value"] == str(missing_id)

    def test_update_risk_submission_from_different_ar_404(
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

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=submission,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request(
                [submission_on_other_ar.award_recommendation_application_submission_id]
            ),
        )

        assert resp.status_code == 404
        resp_json = resp.get_json()
        assert len(resp_json["errors"]) == 1
        assert resp_json["errors"][0]["type"] == "application_submission_not_found"


####################################
# 401 Tests
####################################


class TestUpdateAwardRecommendationRisk401:

    def test_update_risk_no_token_401(self, client, enable_factory_create):
        resp = client.put(
            _build_url(uuid.uuid4(), uuid.uuid4()),
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 401

    def test_update_risk_invalid_token_401(self, client, enable_factory_create):
        resp = client.put(
            _build_url(uuid.uuid4(), uuid.uuid4()),
            headers={"X-SGG-Token": "invalid-token"},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestUpdateAwardRecommendationRisk403:

    def test_update_risk_wrong_agency_403(
        self, client, db_session, award_recommendation, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=submission,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request([submission.award_recommendation_application_submission_id]),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_update_risk_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )
        AwardRecommendationRiskSubmissionFactory.create(
            award_recommendation_risk=risk,
            award_recommendation_application_submission=submission,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json=_build_request([submission.award_recommendation_application_submission_id]),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


####################################
# 422 Tests
####################################


class TestUpdateAwardRecommendationRisk422:

    def test_update_risk_missing_comment_422(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json={
                "award_recommendation_risk_type": AwardRecommendationRiskType.ADDITIONAL_MONITORING,
                "award_recommendation_application_submission_ids": [str(uuid.uuid4())],
            },
        )

        assert resp.status_code == 422

    def test_update_risk_invalid_enum_422(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json={
                "comment": "Some risk",
                "award_recommendation_risk_type": "not_a_real_type",
                "award_recommendation_application_submission_ids": [str(uuid.uuid4())],
            },
        )

        assert resp.status_code == 422

    def test_update_risk_missing_submissions_422(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
        )

        resp = client.put(
            _build_url(
                award_recommendation.award_recommendation_id, risk.award_recommendation_risk_id
            ),
            headers={"X-SGG-Token": token},
            json={
                "comment": "Some risk",
                "award_recommendation_risk_type": AwardRecommendationRiskType.ADDITIONAL_MONITORING,
            },
        )

        assert resp.status_code == 422
