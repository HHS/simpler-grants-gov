import uuid
from decimal import Decimal

import pytest

from src.constants.lookup_constants import (
    AwardRecommendationStatus,
    AwardRecommendationType,
    Privilege,
)
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationApplicationSubmissionFactory,
    AwardRecommendationFactory,
    AwardRecommendationSubmissionDetailFactory,
    OpportunityFactory,
)

API_URL = "/alpha/award-recommendations"

DEFAULT_PAGINATION = {
    "pagination": {
        "page_offset": 1,
        "page_size": 25,
        "sort_order": [
            {"order_by": "application_submission_number", "sort_direction": "ascending"}
        ],
    }
}


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


####################################
# Happy Path Tests
####################################


class TestListAwardRecommendationSubmissions200:

    def test_list_submissions_empty_200(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 200
        assert resp.json["data"] == []
        assert resp.json["pagination_info"]["total_records"] == 0
        assert resp.json["pagination_info"]["total_pages"] == 0

    def test_list_submissions_with_data_200(self, client, db_session, agency, award_recommendation):
        detail = AwardRecommendationSubmissionDetailFactory.create(
            award_recommendation_type=AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
            recommended_amount=Decimal("100000.00"),
            scoring_comment="Strong proposal",
            general_comment="Well written",
            has_exception=False,
            exception_detail=None,
        )
        submission = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
            award_recommendation_submission_detail=detail,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data) == 1

        row = data[0]
        assert row["award_recommendation_application_submission_id"] == str(
            submission.award_recommendation_application_submission_id
        )

        app_sub = row["application_submission"]
        assert app_sub["application_submission_id"] == str(
            submission.application_submission.application_submission_id
        )
        assert app_sub["application_submission_number"] is not None
        assert app_sub["project_title"] is not None
        assert "application" in app_sub

        sd = row["submission_detail"]
        assert sd["recommended_amount"] == "100000.00"
        assert sd["award_recommendation_type"] == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        assert sd["scoring_comment"] == "Strong proposal"
        assert sd["general_comment"] == "Well written"
        assert sd["has_exception"] is False
        assert sd["exception_detail"] is None

    def test_list_submissions_pagination_200(
        self, client, db_session, agency, award_recommendation
    ):
        for _ in range(3):
            AwardRecommendationApplicationSubmissionFactory.create(
                award_recommendation=award_recommendation,
            )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 2,
                    "sort_order": [
                        {
                            "order_by": "application_submission_number",
                            "sort_direction": "ascending",
                        }
                    ],
                }
            },
        )

        assert resp.status_code == 200
        assert len(resp.json["data"]) == 2
        assert resp.json["pagination_info"]["total_records"] == 3
        assert resp.json["pagination_info"]["total_pages"] == 2
        assert resp.json["pagination_info"]["page_offset"] == 1

    def test_list_submissions_filter_by_type_200(
        self, client, db_session, agency, award_recommendation
    ):
        funded_detail = AwardRecommendationSubmissionDetailFactory.create(
            award_recommendation_type=AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
        )
        not_rec_detail = AwardRecommendationSubmissionDetailFactory.create(
            award_recommendation_type=AwardRecommendationType.NOT_RECOMMENDED,
        )
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
            award_recommendation_submission_detail=funded_detail,
        )
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
            award_recommendation_submission_detail=not_rec_detail,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json={
                "filters": {
                    "award_recommendation_type": {
                        "one_of": [AwardRecommendationType.RECOMMENDED_FOR_FUNDING]
                    }
                },
                **DEFAULT_PAGINATION,
            },
        )

        assert resp.status_code == 200
        assert len(resp.json["data"]) == 1
        assert (
            resp.json["data"][0]["submission_detail"]["award_recommendation_type"]
            == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        )

    def test_list_submissions_filter_by_has_exception_200(
        self, client, db_session, agency, award_recommendation
    ):
        exception_detail = AwardRecommendationSubmissionDetailFactory.create(
            has_exception=True,
            exception_detail="Budget exceeds threshold",
        )
        normal_detail = AwardRecommendationSubmissionDetailFactory.create(
            has_exception=False,
        )
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
            award_recommendation_submission_detail=exception_detail,
        )
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
            award_recommendation_submission_detail=normal_detail,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json={
                "filters": {"has_exception": {"one_of": [True]}},
                **DEFAULT_PAGINATION,
            },
        )

        assert resp.status_code == 200
        assert len(resp.json["data"]) == 1
        assert resp.json["data"][0]["submission_detail"]["has_exception"] is True


####################################
# 404 Tests
####################################


class TestListAwardRecommendationSubmissions404:

    def test_list_submissions_not_found_404(
        self, client, db_session, agency, enable_factory_create
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        non_existent_id = uuid.uuid4()
        resp = client.post(
            f"{API_URL}/{non_existent_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 404

    def test_list_submissions_deleted_award_rec_404(self, client, db_session, agency, opportunity):
        ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{ar.award_recommendation_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 404


####################################
# 401 Tests
####################################


class TestListAwardRecommendationSubmissions401:

    def test_list_submissions_no_token_401(self, client, enable_factory_create):
        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/submissions/list",
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 401

    def test_list_submissions_invalid_token_401(self, client, enable_factory_create):
        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/submissions/list",
            headers={"X-SGG-Token": "invalid-token"},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestListAwardRecommendationSubmissions403:

    def test_list_submissions_wrong_agency_403(
        self, client, db_session, award_recommendation, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_list_submissions_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submissions/list",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"
