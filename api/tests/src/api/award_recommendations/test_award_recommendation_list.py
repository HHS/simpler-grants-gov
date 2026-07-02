import datetime
import uuid

import pytest

from src.constants.lookup_constants import AwardRecommendationStatus, Privilege
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import (
    create_user_in_agency_with_jwt,
    give_user_privilege_in_agency,
)
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationApplicationSubmissionFactory,
    AwardRecommendationFactory,
    OpportunityFactory,
)

API_URL = "/alpha/award-recommendations/list"


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
    agency_ids: list[uuid.UUID],
    page_offset: int = 1,
    page_size: int = 25,
    sort_direction: str = "ascending",
) -> dict:
    return {
        "filters": {"agency_id": {"one_of": [str(aid) for aid in agency_ids]}},
        "pagination": {
            "page_offset": page_offset,
            "page_size": page_size,
            "sort_order": [{"order_by": "created_at", "sort_direction": sort_direction}],
        },
    }


####################################
# 200 Tests
####################################


class TestListAwardRecommendations200:

    def test_list_award_recommendations_200_paginates_and_sorts(
        self, client, db_session, agency, opportunity
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        t1 = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC)
        t2 = datetime.datetime(2026, 1, 2, tzinfo=datetime.UTC)
        t3 = datetime.datetime(2026, 1, 3, tzinfo=datetime.UTC)

        ar1 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            created_at=t1,
            review_workflow=None,
            review_workflow_id=None,
        )
        ar2 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            created_at=t2,
            review_workflow=None,
            review_workflow_id=None,
        )
        ar3 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            created_at=t3,
            review_workflow=None,
            review_workflow_id=None,
        )
        # Deleted award recs should be excluded
        AwardRecommendationFactory.create(
            opportunity=opportunity,
            created_at=datetime.datetime(2026, 1, 4, tzinfo=datetime.UTC),
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request(
                [agency.agency_id], page_offset=1, page_size=2, sort_direction="ascending"
            ),
        )

        assert resp.status_code == 200
        assert resp.json["pagination_info"]["total_records"] == 3
        assert resp.json["pagination_info"]["total_pages"] == 2
        assert len(resp.json["data"]) == 2

        returned_ids_page1 = [d["award_recommendation_id"] for d in resp.json["data"]]
        assert returned_ids_page1 == [
            str(ar1.award_recommendation_id),
            str(ar2.award_recommendation_id),
        ]

        resp2 = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request(
                [agency.agency_id], page_offset=2, page_size=2, sort_direction="ascending"
            ),
        )

        assert resp2.status_code == 200
        assert len(resp2.json["data"]) == 1
        assert resp2.json["data"][0]["award_recommendation_id"] == str(ar3.award_recommendation_id)

    def test_list_award_recommendations_200_desc_sort(
        self, client, db_session, agency, opportunity
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        t1 = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC)
        t2 = datetime.datetime(2026, 1, 2, tzinfo=datetime.UTC)

        ar1 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            created_at=t1,
            review_workflow=None,
            review_workflow_id=None,
        )
        ar2 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            created_at=t2,
            review_workflow=None,
            review_workflow_id=None,
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id], sort_direction="descending"),
        )

        assert resp.status_code == 200
        returned_ids = [d["award_recommendation_id"] for d in resp.json["data"]]
        assert returned_ids == [
            str(ar2.award_recommendation_id),
            str(ar1.award_recommendation_id),
        ]

    def test_list_award_recommendations_200_multiple_agencies(
        self, client, db_session, agency, opportunity, award_recommendation
    ):
        other_agency = AgencyFactory.create()
        other_opportunity = OpportunityFactory.create(agency_code=other_agency.agency_code)
        other_ar = AwardRecommendationFactory.create(
            opportunity=other_opportunity,
            review_workflow=None,
            review_workflow_id=None,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )
        give_user_privilege_in_agency(
            user, other_agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id, other_agency.agency_id]),
        )

        assert resp.status_code == 200
        assert resp.json["pagination_info"]["total_records"] == 2
        returned_ids = {d["award_recommendation_id"] for d in resp.json["data"]}
        assert returned_ids == {
            str(award_recommendation.award_recommendation_id),
            str(other_ar.award_recommendation_id),
        }

    def test_list_award_recommendations_200_excludes_other_agencies(
        self, client, db_session, agency, opportunity, award_recommendation
    ):
        # Award recommendation under a different agency that the user does NOT request
        other_agency = AgencyFactory.create()
        other_opportunity = OpportunityFactory.create(agency_code=other_agency.agency_code)
        AwardRecommendationFactory.create(
            opportunity=other_opportunity,
            review_workflow=None,
            review_workflow_id=None,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id]),
        )

        assert resp.status_code == 200
        assert resp.json["pagination_info"]["total_records"] == 1
        assert resp.json["data"][0]["award_recommendation_id"] == str(
            award_recommendation.award_recommendation_id
        )

    def test_list_award_recommendations_200_empty(self, client, db_session, agency):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id]),
        )

        assert resp.status_code == 200
        assert resp.json["data"] == []
        assert resp.json["pagination_info"]["total_records"] == 0
        assert resp.json["pagination_info"]["total_pages"] == 0

    def test_list_award_recommendations_200_includes_total_received_count(
        self, client, db_session, agency, opportunity
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        ar_with_submissions = AwardRecommendationFactory.create(
            opportunity=opportunity,
            review_workflow=None,
            review_workflow_id=None,
        )
        ar_without_submissions = AwardRecommendationFactory.create(
            opportunity=opportunity,
            review_workflow=None,
            review_workflow_id=None,
        )
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=ar_with_submissions
        )
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=ar_with_submissions
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id]),
        )

        assert resp.status_code == 200
        counts_by_id = {
            row["award_recommendation_id"]: row["award_recommendation_summary"][
                "total_received_count"
            ]
            for row in resp.json["data"]
        }
        assert counts_by_id[str(ar_with_submissions.award_recommendation_id)] == 2
        assert counts_by_id[str(ar_without_submissions.award_recommendation_id)] == 0


####################################
# 404 Tests
####################################


class TestListAwardRecommendations404:

    def test_list_award_recommendations_agency_not_found_404(
        self, client, db_session, agency, enable_factory_create
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        missing_id = uuid.uuid4()
        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([missing_id]),
        )

        assert resp.status_code == 404
        resp_json = resp.get_json()
        assert len(resp_json["errors"]) == 1
        assert resp_json["errors"][0]["type"] == "agency_not_found"
        assert resp_json["errors"][0]["field"] == "filters.agency_id.one_of"
        assert resp_json["errors"][0]["value"] == str(missing_id)

    def test_list_award_recommendations_one_of_many_agencies_missing_404(
        self, client, db_session, agency, enable_factory_create
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        missing_id = uuid.uuid4()
        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id, missing_id]),
        )

        assert resp.status_code == 404
        resp_json = resp.get_json()
        assert len(resp_json["errors"]) == 1
        assert resp_json["errors"][0]["type"] == "agency_not_found"
        assert resp_json["errors"][0]["value"] == str(missing_id)


####################################
# 401 Tests
####################################


class TestListAwardRecommendations401:

    def test_list_award_recommendations_no_token_401(self, client, enable_factory_create):
        resp = client.post(
            API_URL,
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 401

    def test_list_award_recommendations_invalid_token_401(self, client, enable_factory_create):
        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": "invalid-token"},
            json=_build_request([uuid.uuid4()]),
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestListAwardRecommendations403:

    def test_list_award_recommendations_wrong_agency_403(
        self, client, db_session, agency, enable_factory_create
    ):
        # User has VIEW privilege but in a DIFFERENT agency
        other_agency = AgencyFactory.create()
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id]),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_list_award_recommendations_wrong_privilege_403(self, client, db_session, agency):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id]),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_list_award_recommendations_one_of_many_agencies_unauthorized_403(
        self, client, db_session, agency
    ):
        # User has access to `agency` but not to `other_agency`
        other_agency = AgencyFactory.create()
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([agency.agency_id, other_agency.agency_id]),
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


####################################
# 422 Tests
####################################


class TestListAwardRecommendations422:

    def test_list_award_recommendations_missing_filters_422(self, client, db_session, agency):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                    "sort_order": [{"order_by": "created_at", "sort_direction": "ascending"}],
                }
            },
        )

        assert resp.status_code == 422

    def test_list_award_recommendations_missing_agency_id_422(self, client, db_session, agency):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json={
                "filters": {},
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                    "sort_order": [{"order_by": "created_at", "sort_direction": "ascending"}],
                },
            },
        )

        assert resp.status_code == 422

    def test_list_award_recommendations_empty_agency_one_of_422(self, client, db_session, agency):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            API_URL,
            headers={"X-SGG-Token": token},
            json=_build_request([]),
        )

        assert resp.status_code == 422
