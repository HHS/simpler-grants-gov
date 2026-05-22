import uuid

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import AwardRecommendationStatus, Privilege
from src.db.models.award_recommendation_models import AwardRecommendation
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
        is_deleted=False,
        review_workflow=None,
        review_workflow_id=None,
    )


####################################
# 200 Tests
####################################


class TestDeleteAwardRecommendation200:

    def test_delete_award_recommendation_200(
        self, client, db_session, agency, award_recommendation
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        assert resp.json["message"] == "Success"
        assert resp.json["data"] is None

        db_session.expire_all()

        deleted_award_recommendation = db_session.execute(
            select(AwardRecommendation).where(
                AwardRecommendation.award_recommendation_id
                == award_recommendation.award_recommendation_id
            )
        ).scalar_one()
        assert deleted_award_recommendation.is_deleted is True


####################################
# 404 Tests
####################################


class TestDeleteAwardRecommendation404:

    def test_delete_award_recommendation_not_found_404(self, client, db_session, agency):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{uuid.uuid4()}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_delete_already_deleted_award_recommendation_404(
        self, client, db_session, agency, opportunity
    ):
        deleted_award_recommendation = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.DRAFT,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )

        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{deleted_award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404


####################################
# 401 Tests
####################################


class TestDeleteAwardRecommendation401:

    def test_delete_award_recommendation_no_token_401(self, client, award_recommendation):
        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
        )

        assert resp.status_code == 401

    def test_delete_award_recommendation_invalid_token_401(self, client, award_recommendation):
        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": "invalid-token"},
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestDeleteAwardRecommendation403:

    def test_delete_award_recommendation_wrong_agency_403(
        self, client, db_session, award_recommendation
    ):
        other_agency = AgencyFactory.create()
        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=other_agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

        db_session.expire_all()
        unchanged_award_recommendation = db_session.execute(
            select(AwardRecommendation).where(
                AwardRecommendation.award_recommendation_id
                == award_recommendation.award_recommendation_id
            )
        ).scalar_one()
        assert unchanged_award_recommendation.is_deleted is False

    def test_delete_award_recommendation_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

        db_session.expire_all()
        unchanged_award_recommendation = db_session.execute(
            select(AwardRecommendation).where(
                AwardRecommendation.award_recommendation_id
                == award_recommendation.award_recommendation_id
            )
        ).scalar_one()
        assert unchanged_award_recommendation.is_deleted is False
