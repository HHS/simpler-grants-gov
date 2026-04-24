import datetime
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


def _build_request(
    page_offset: int = 1, page_size: int = 25, sort_direction: str = "ascending"
) -> dict:
    return {
        "pagination": {
            "page_offset": page_offset,
            "page_size": page_size,
            "sort_order": [{"order_by": "created_at", "sort_direction": sort_direction}],
        }
    }


####################################
# 200 Tests
####################################


class TestListAwardRecommendationRisks200:

    def test_list_risks_200_paginates_and_sorts(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        sub = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )

        t1 = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC)
        t2 = datetime.datetime(2026, 1, 2, tzinfo=datetime.UTC)
        t3 = datetime.datetime(2026, 1, 3, tzinfo=datetime.UTC)

        risk1 = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            created_at=t1,
            award_recommendation_risk_type=AwardRecommendationRiskType.ADDITIONAL_MONITORING,
            comment="r1",
        )
        risk2 = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            created_at=t2,
            award_recommendation_risk_type=AwardRecommendationRiskType.ADDITIONAL_MONITORING,
            comment="r2",
        )
        risk3 = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            created_at=t3,
            award_recommendation_risk_type=AwardRecommendationRiskType.ADDITIONAL_MONITORING,
            comment="r3",
        )
        # Deleted risk should be excluded
        AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            created_at=datetime.datetime(2026, 1, 4, tzinfo=datetime.UTC),
            is_deleted=True,
        )

        for risk in [risk1, risk2, risk3]:
            AwardRecommendationRiskSubmissionFactory.create(
                award_recommendation_risk=risk,
                award_recommendation_application_submission=sub,
            )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/list",
            headers={"X-SGG-Token": token},
            json=_build_request(page_offset=1, page_size=2, sort_direction="ascending"),
        )

        assert resp.status_code == 200
        assert resp.json["pagination_info"]["total_records"] == 3
        assert resp.json["pagination_info"]["total_pages"] == 2
        assert len(resp.json["data"]) == 2

        returned_ids_page1 = [d["award_recommendation_risk_id"] for d in resp.json["data"]]
        assert returned_ids_page1 == [
            str(risk1.award_recommendation_risk_id),
            str(risk2.award_recommendation_risk_id),
        ]

        expected_sub_ids = [str(sub.award_recommendation_application_submission_id)]
        for risk_data in resp.json["data"]:
            assert risk_data["award_recommendation_application_submission_ids"] == expected_sub_ids

        resp2 = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/list",
            headers={"X-SGG-Token": token},
            json=_build_request(page_offset=2, page_size=2, sort_direction="ascending"),
        )

        assert resp2.status_code == 200
        assert len(resp2.json["data"]) == 1
        assert resp2.json["data"][0]["award_recommendation_risk_id"] == str(
            risk3.award_recommendation_risk_id
        )
        assert (
            resp2.json["data"][0]["award_recommendation_application_submission_ids"]
            == expected_sub_ids
        )

    def test_list_risks_200_desc_sort(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        sub = AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation,
        )

        t1 = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC)
        t2 = datetime.datetime(2026, 1, 2, tzinfo=datetime.UTC)

        risk1 = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            created_at=t1,
        )
        risk2 = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            created_at=t2,
        )
        for risk in [risk1, risk2]:
            AwardRecommendationRiskSubmissionFactory.create(
                award_recommendation_risk=risk,
                award_recommendation_application_submission=sub,
            )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/list",
            headers={"X-SGG-Token": token},
            json=_build_request(page_offset=1, page_size=25, sort_direction="descending"),
        )

        assert resp.status_code == 200
        returned_ids = [d["award_recommendation_risk_id"] for d in resp.json["data"]]
        assert returned_ids == [
            str(risk2.award_recommendation_risk_id),
            str(risk1.award_recommendation_risk_id),
        ]

        expected_sub_ids = [str(sub.award_recommendation_application_submission_id)]
        for risk_data in resp.json["data"]:
            assert risk_data["award_recommendation_application_submission_ids"] == expected_sub_ids


####################################
# 404 Tests
####################################


class TestListAwardRecommendationRisks404:

    def test_list_risks_ar_not_found_404(self, client, db_session, agency, enable_factory_create):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/risks/list",
            headers={"X-SGG-Token": token},
            json=_build_request(),
        )

        assert resp.status_code == 404

    def test_list_risks_ar_deleted_404(
        self, client, db_session, agency, opportunity, enable_factory_create
    ):
        deleted_ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{deleted_ar.award_recommendation_id}/risks/list",
            headers={"X-SGG-Token": token},
            json=_build_request(),
        )

        assert resp.status_code == 404


####################################
# 401 Tests
####################################


class TestListAwardRecommendationRisks401:

    def test_list_risks_no_token_401(self, client, enable_factory_create):
        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/risks/list",
            json=_build_request(),
        )

        assert resp.status_code == 401

    def test_list_risks_invalid_token_401(self, client, enable_factory_create):
        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/risks/list",
            headers={"X-SGG-Token": "invalid-token"},
            json=_build_request(),
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestListAwardRecommendationRisks403:

    def test_list_risks_wrong_agency_403(
        self, client, db_session, award_recommendation, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/list",
            headers={"X-SGG-Token": token},
            json=_build_request(),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_list_risks_wrong_privilege_403(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/list",
            headers={"X-SGG-Token": token},
            json=_build_request(),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"
