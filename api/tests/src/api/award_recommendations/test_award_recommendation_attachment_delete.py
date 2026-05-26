import uuid
from unittest.mock import patch

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    AwardRecommendationStatus,
    Privilege,
)
from src.db.models.award_recommendation_models import (
    AwardRecommendationAttachment,
    AwardRecommendationAudit,
)
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationAttachmentFactory,
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


@pytest.fixture
def award_recommendation_attachment(award_recommendation):
    return AwardRecommendationAttachmentFactory.create(
        award_recommendation=award_recommendation,
        is_deleted=False,
    )


####################################
# 200 Tests
####################################


class TestDeleteAwardRecommendationAttachment200:

    @patch(
        "src.services.award_recommendations.delete_award_recommendation_attachment.file_util.delete_file"
    )
    def test_delete_attachment_200(
        self,
        mock_delete_file,
        client,
        db_session,
        agency,
        award_recommendation,
        award_recommendation_attachment,
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        original_file_location = award_recommendation_attachment.file_location

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments/"
            f"{award_recommendation_attachment.award_recommendation_attachment_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        assert resp.json["message"] == "Success"
        assert resp.json["data"] is None

        mock_delete_file.assert_called_once_with(original_file_location)

        db_session.expire_all()

        deleted_attachment = db_session.execute(
            select(AwardRecommendationAttachment).where(
                AwardRecommendationAttachment.award_recommendation_attachment_id
                == award_recommendation_attachment.award_recommendation_attachment_id
            )
        ).scalar_one()
        assert deleted_attachment.is_deleted is True
        assert deleted_attachment.file_location == "DELETED"

        audit_event = db_session.execute(
            select(AwardRecommendationAudit).where(
                AwardRecommendationAudit.award_recommendation_id
                == award_recommendation.award_recommendation_id,
                AwardRecommendationAudit.award_recommendation_audit_event
                == AwardRecommendationAuditEvent.ATTACHMENT_DELETED,
            )
        ).scalar_one()
        assert (
            audit_event.award_recommendation_attachment_id
            == award_recommendation_attachment.award_recommendation_attachment_id
        )


####################################
# 404 Tests
####################################


class TestDeleteAwardRecommendationAttachment404:

    def test_delete_attachment_not_found_404(
        self, client, db_session, agency, award_recommendation
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments/{uuid.uuid4()}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_delete_attachment_wrong_award_recommendation_404(
        self, client, db_session, agency, opportunity, award_recommendation_attachment
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
            f"{API_URL}/{other_award_recommendation.award_recommendation_id}/attachments/"
            f"{award_recommendation_attachment.award_recommendation_attachment_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_delete_already_deleted_attachment_404(
        self, client, db_session, agency, award_recommendation
    ):
        deleted_attachment = AwardRecommendationAttachmentFactory.create(
            award_recommendation=award_recommendation,
            is_deleted=True,
        )

        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments/"
            f"{deleted_attachment.award_recommendation_attachment_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_delete_attachment_deleted_award_recommendation_404(
        self, client, db_session, agency, opportunity
    ):
        deleted_award_recommendation = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.DRAFT,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )
        attachment = AwardRecommendationAttachmentFactory.create(
            award_recommendation=deleted_award_recommendation,
            is_deleted=False,
        )

        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.delete(
            f"{API_URL}/{deleted_award_recommendation.award_recommendation_id}/attachments/"
            f"{attachment.award_recommendation_attachment_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

        db_session.expire_all()
        unchanged_attachment = db_session.execute(
            select(AwardRecommendationAttachment).where(
                AwardRecommendationAttachment.award_recommendation_attachment_id
                == attachment.award_recommendation_attachment_id
            )
        ).scalar_one()
        assert unchanged_attachment.is_deleted is False


####################################
# 401 Tests
####################################


class TestDeleteAwardRecommendationAttachment401:

    def test_delete_attachment_no_token_401(
        self, client, award_recommendation, award_recommendation_attachment
    ):
        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments/"
            f"{award_recommendation_attachment.award_recommendation_attachment_id}",
        )

        assert resp.status_code == 401

    def test_delete_attachment_invalid_token_401(
        self, client, award_recommendation, award_recommendation_attachment
    ):
        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments/"
            f"{award_recommendation_attachment.award_recommendation_attachment_id}",
            headers={"X-SGG-Token": "invalid-token"},
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestDeleteAwardRecommendationAttachment403:

    def test_delete_attachment_wrong_agency_403(
        self, client, db_session, award_recommendation, award_recommendation_attachment
    ):
        other_agency = AgencyFactory.create()
        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=other_agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments/"
            f"{award_recommendation_attachment.award_recommendation_attachment_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

        db_session.expire_all()
        unchanged_attachment = db_session.execute(
            select(AwardRecommendationAttachment).where(
                AwardRecommendationAttachment.award_recommendation_attachment_id
                == award_recommendation_attachment.award_recommendation_attachment_id
            )
        ).scalar_one()
        assert unchanged_attachment.is_deleted is False

    def test_delete_attachment_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation, award_recommendation_attachment
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_AWARD_RECOMMENDATION],
        )

        resp = client.delete(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments/"
            f"{award_recommendation_attachment.award_recommendation_attachment_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

        db_session.expire_all()
        unchanged_attachment = db_session.execute(
            select(AwardRecommendationAttachment).where(
                AwardRecommendationAttachment.award_recommendation_attachment_id
                == award_recommendation_attachment.award_recommendation_attachment_id
            )
        ).scalar_one()
        assert unchanged_attachment.is_deleted is False
