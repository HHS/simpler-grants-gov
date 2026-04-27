import uuid

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import AwardRecommendationStatus, Privilege
from src.db.models.award_recommendation_models import AwardRecommendationRisk
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationFactory,
    AwardRecommendationRiskFactory,
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


@pytest.fixture
def award_recommendation_risk(award_recommendation):
    return AwardRecommendationRiskFactory.create(
        award_recommendation=award_recommendation,
        is_deleted=False,
    )


####################################
# 200 Tests
####################################


class TestDeleteAwardRecommendationRisk200:

    def test_delete_risk_200(
        self, client, db_session, agency, award_recommendation, award_recommendation_risk
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/"
            f"{award_recommendation_risk.award_recommendation_risk_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        assert resp.json["message"] == "Success"
        assert resp.json["data"] is None

        db_session.expire_all()

        deleted_risk = db_session.execute(
            select(AwardRecommendationRisk).where(
                AwardRecommendationRisk.award_recommendation_risk_id
                == award_recommendation_risk.award_recommendation_risk_id
            )
        ).scalar_one()
        assert deleted_risk.is_deleted is True


####################################
# 404 Tests
####################################


class TestDeleteAwardRecommendationRisk404:

    def test_delete_risk_not_found_404(self, client, db_session, agency, award_recommendation):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/{uuid.uuid4()}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_delete_risk_wrong_award_recommendation_404(
        self, client, db_session, agency, opportunity, award_recommendation_risk
    ):
        other_award_recommendation = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.DRAFT,
            is_deleted=False,
            review_workflow=None,
            review_workflow_id=None,
        )

        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{other_award_recommendation.award_recommendation_id}/risks/"
            f"{award_recommendation_risk.award_recommendation_risk_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_delete_already_deleted_risk_404(
        self, client, db_session, agency, award_recommendation
    ):
        deleted_risk = AwardRecommendationRiskFactory.create(
            award_recommendation=award_recommendation,
            is_deleted=True,
        )

        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/"
            f"{deleted_risk.award_recommendation_risk_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_delete_risk_deleted_award_recommendation_404(
        self, client, db_session, agency, opportunity
    ):
        deleted_award_recommendation = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.DRAFT,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )
        risk = AwardRecommendationRiskFactory.create(
            award_recommendation=deleted_award_recommendation,
            is_deleted=False,
        )

        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{deleted_award_recommendation.award_recommendation_id}/risks/"
            f"{risk.award_recommendation_risk_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

        db_session.expire_all()
        unchanged_risk = db_session.execute(
            select(AwardRecommendationRisk).where(
                AwardRecommendationRisk.award_recommendation_risk_id
                == risk.award_recommendation_risk_id
            )
        ).scalar_one()
        assert unchanged_risk.is_deleted is False


####################################
# 401 Tests
####################################


class TestDeleteAwardRecommendationRisk401:

    def test_delete_risk_no_token_401(
        self, client, award_recommendation, award_recommendation_risk
    ):
        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/"
            f"{award_recommendation_risk.award_recommendation_risk_id}",
        )

        assert resp.status_code == 401

    def test_delete_risk_invalid_token_401(
        self, client, award_recommendation, award_recommendation_risk
    ):
        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/"
            f"{award_recommendation_risk.award_recommendation_risk_id}",
            headers={"X-SGG-Token": "invalid-token"},
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestDeleteAwardRecommendationRisk403:

    def test_delete_risk_wrong_agency_403(
        self, client, db_session, award_recommendation, award_recommendation_risk
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=other_agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/"
            f"{award_recommendation_risk.award_recommendation_risk_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

        db_session.expire_all()
        unchanged_risk = db_session.execute(
            select(AwardRecommendationRisk).where(
                AwardRecommendationRisk.award_recommendation_risk_id
                == award_recommendation_risk.award_recommendation_risk_id
            )
        ).scalar_one()
        assert unchanged_risk.is_deleted is False

    def test_delete_risk_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation, award_recommendation_risk
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/risks/"
            f"{award_recommendation_risk.award_recommendation_risk_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

        db_session.expire_all()
        unchanged_risk = db_session.execute(
            select(AwardRecommendationRisk).where(
                AwardRecommendationRisk.award_recommendation_risk_id
                == award_recommendation_risk.award_recommendation_risk_id
            )
        ).scalar_one()
        assert unchanged_risk.is_deleted is False
