import uuid

import pytest

from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    AwardRecommendationReviewType,
    AwardRecommendationStatus,
    AwardSelectionMethod,
    Privilege,
)
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationFactory,
    AwardRecommendationReviewFactory,
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
        is_deleted=False,
        review_workflow=None,
        review_workflow_id=None,
    )


@pytest.fixture
def review(award_recommendation):
    return AwardRecommendationReviewFactory.create(
        award_recommendation=award_recommendation,
        award_recommendation_review_type=AwardRecommendationReviewType.MERIT_REVIEW,
        is_reviewed=False,
    )


def _url(award_recommendation_id: uuid.UUID, review_id: uuid.UUID) -> str:
    return f"{API_URL}/{award_recommendation_id}/reviews/{review_id}"


####################################
# Happy Path Tests
####################################


class TestUpdateAwardRecommendationReview200:

    def test_set_is_reviewed_true(self, client, db_session, agency, award_recommendation, review):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.VIEW_AWARD_RECOMMENDATION,
                Privilege.UPDATE_AWARD_RECOMMENDATION,
            ],
        )

        resp = client.put(
            _url(
                award_recommendation.award_recommendation_id, review.award_recommendation_review_id
            ),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert data["award_recommendation_review_id"] == str(review.award_recommendation_review_id)
        assert (
            data["award_recommendation_review_type"] == AwardRecommendationReviewType.MERIT_REVIEW
        )
        assert data["is_reviewed"] is True

    def test_set_is_reviewed_false(self, client, db_session, agency, opportunity):
        ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=False,
            review_workflow=None,
            review_workflow_id=None,
        )
        rev = AwardRecommendationReviewFactory.create(
            award_recommendation=ar,
            award_recommendation_review_type=AwardRecommendationReviewType.PROGRAMMATIC_REVIEW,
            is_reviewed=True,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.VIEW_AWARD_RECOMMENDATION,
                Privilege.UPDATE_AWARD_RECOMMENDATION,
            ],
        )

        resp = client.put(
            _url(ar.award_recommendation_id, rev.award_recommendation_review_id),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": False},
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert data["is_reviewed"] is False

    def test_creates_audit_event(self, client, db_session, agency, award_recommendation, review):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.VIEW_AWARD_RECOMMENDATION,
                Privilege.UPDATE_AWARD_RECOMMENDATION,
            ],
        )

        resp = client.put(
            _url(
                award_recommendation.award_recommendation_id, review.award_recommendation_review_id
            ),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 200

        # Verify audit event was created
        db_session.expire_all()
        audit_events = award_recommendation.award_recommendation_audit_events
        review_audit = [
            e
            for e in audit_events
            if e.award_recommendation_audit_event == AwardRecommendationAuditEvent.REVIEW_UPDATED
        ]
        assert len(review_audit) == 1
        assert (
            review_audit[0].award_recommendation_review_id == review.award_recommendation_review_id
        )


####################################
# 404 Tests
####################################


class TestUpdateAwardRecommendationReview404:

    def test_award_recommendation_not_found(
        self, client, db_session, agency, enable_factory_create
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.VIEW_AWARD_RECOMMENDATION,
                Privilege.UPDATE_AWARD_RECOMMENDATION,
            ],
        )

        resp = client.put(
            _url(uuid.uuid4(), uuid.uuid4()),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 404

    def test_review_not_found(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.VIEW_AWARD_RECOMMENDATION,
                Privilege.UPDATE_AWARD_RECOMMENDATION,
            ],
        )

        resp = client.put(
            _url(award_recommendation.award_recommendation_id, uuid.uuid4()),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 404
        assert "Could not find Award Recommendation Review" in resp.json["message"]

    def test_deleted_award_recommendation(self, client, db_session, agency, opportunity):
        ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )
        rev = AwardRecommendationReviewFactory.create(award_recommendation=ar)

        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.VIEW_AWARD_RECOMMENDATION,
                Privilege.UPDATE_AWARD_RECOMMENDATION,
            ],
        )

        resp = client.put(
            _url(ar.award_recommendation_id, rev.award_recommendation_review_id),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 404


####################################
# 401 Tests
####################################


class TestUpdateAwardRecommendationReview401:

    def test_no_token(self, client, enable_factory_create):
        resp = client.put(
            _url(uuid.uuid4(), uuid.uuid4()),
            json={"is_reviewed": True},
        )

        assert resp.status_code == 401
        assert resp.json["message"] == "Unauthorized"

    def test_invalid_token(self, client, enable_factory_create):
        resp = client.put(
            _url(uuid.uuid4(), uuid.uuid4()),
            headers={"X-SGG-Token": "invalid-token"},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 401
        assert resp.json["message"] == "Unable to process token"


####################################
# 403 Tests
####################################


class TestUpdateAwardRecommendationReview403:

    def test_wrong_agency(
        self, client, db_session, award_recommendation, review, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=other_agency,
            privileges=[
                Privilege.VIEW_AWARD_RECOMMENDATION,
                Privilege.UPDATE_AWARD_RECOMMENDATION,
            ],
        )

        resp = client.put(
            _url(
                award_recommendation.award_recommendation_id, review.award_recommendation_review_id
            ),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_missing_update_privilege(
        self, client, db_session, agency, award_recommendation, review
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        resp = client.put(
            _url(
                award_recommendation.award_recommendation_id, review.award_recommendation_review_id
            ),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_wrong_privilege(self, client, db_session, agency, award_recommendation, review):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_OPPORTUNITY],
        )

        resp = client.put(
            _url(
                award_recommendation.award_recommendation_id, review.award_recommendation_review_id
            ),
            headers={"X-SGG-Token": token},
            json={"is_reviewed": True},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


####################################
# 422 Tests
####################################


class TestUpdateAwardRecommendationReview422:

    def test_missing_is_reviewed(self, client, db_session, agency, award_recommendation, review):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.VIEW_AWARD_RECOMMENDATION,
                Privilege.UPDATE_AWARD_RECOMMENDATION,
            ],
        )

        resp = client.put(
            _url(
                award_recommendation.award_recommendation_id, review.award_recommendation_review_id
            ),
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 422
