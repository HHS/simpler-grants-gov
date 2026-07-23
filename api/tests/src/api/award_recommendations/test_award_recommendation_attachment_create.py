import uuid

import grants_shared.util.file_util as file_util
import pytest
from sqlalchemy import select

from src.constants.lookup_constants import (
    AwardRecommendationAttachmentType,
    AwardRecommendationAuditEvent,
    AwardRecommendationStatus,
    FileScanStatus,
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
    AwardRecommendationFactory,
    OpportunityFactory,
    PendingFileFactory,
    UserFactory,
)

API_URL = "/alpha/award-recommendations"


####################################
# Helpers / Fixtures
####################################


def make_pending_file(
    user, s3_config, file_scan_status=FileScanStatus.COMPLETE, mime_type="application/pdf"
):
    """Create a PendingFile backed by a real S3 file."""
    file_name = "test-attachment.pdf"
    source_location = f"{s3_config.file_scan_bucket_path}/scan_complete/{uuid.uuid4()}/{file_name}"
    file_util.write_to_file(source_location, "test file content")
    return PendingFileFactory.create(
        user=user,
        file_name=file_name,
        file_location=source_location,
        file_scan_status=file_scan_status,
        mime_type=mime_type,
    )


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


class TestCreateAwardRecommendationAttachment200:

    def test_create_attachment_200(
        self,
        client,
        db_session,
        agency,
        award_recommendation,
        s3_config,
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        pending_file = make_pending_file(user, s3_config)
        original_location = pending_file.file_location

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 200, resp.json
        assert resp.json["message"] == "Success"

        attachment_id = resp.json["data"]["award_recommendation_attachment_id"]
        assert attachment_id is not None

        db_session.expire_all()
        attachment = db_session.execute(
            select(AwardRecommendationAttachment).where(
                AwardRecommendationAttachment.award_recommendation_attachment_id == attachment_id
            )
        ).scalar_one()

        assert attachment.file_name == "test-attachment.pdf"
        assert (
            attachment.award_recommendation_attachment_type
            == AwardRecommendationAttachmentType.OTHER
        )
        assert attachment.award_recommendation_id == award_recommendation.award_recommendation_id
        assert attachment.is_deleted is False
        assert file_util.file_exists(attachment.file_location) is True
        assert file_util.file_exists(original_location) is False
        assert (
            f"award-recommendations/{award_recommendation.award_recommendation_id}/attachments/"
            f"{attachment_id}/"
        ) in attachment.file_location

        db_session.refresh(pending_file)
        assert pending_file.file_scan_status == FileScanStatus.PROCESSED

        audit_event = db_session.execute(
            select(AwardRecommendationAudit).where(
                AwardRecommendationAudit.award_recommendation_id
                == award_recommendation.award_recommendation_id,
                AwardRecommendationAudit.award_recommendation_audit_event
                == AwardRecommendationAuditEvent.ATTACHMENT_CREATED,
            )
        ).scalar_one()
        assert audit_event.award_recommendation_attachment_id == uuid.UUID(attachment_id)

    def test_create_attachment_with_file_name_override_200(
        self,
        client,
        db_session,
        agency,
        award_recommendation,
        s3_config,
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        pending_file = make_pending_file(user, s3_config)
        override_name = "custom_override_name.pdf"

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": (
                    AwardRecommendationAttachmentType.STANDARD_TERMS
                ),
                "file_name": override_name,
            },
        )

        assert resp.status_code == 200, resp.json

        attachment_id = resp.json["data"]["award_recommendation_attachment_id"]
        db_session.expire_all()
        attachment = db_session.execute(
            select(AwardRecommendationAttachment).where(
                AwardRecommendationAttachment.award_recommendation_attachment_id == attachment_id
            )
        ).scalar_one()

        assert attachment.file_name == override_name
        assert (
            attachment.award_recommendation_attachment_type
            == AwardRecommendationAttachmentType.STANDARD_TERMS
        )
        assert attachment.file_location.endswith(f"/{override_name}")
        assert file_util.file_exists(attachment.file_location) is True


####################################
# 404 Tests
####################################


class TestCreateAwardRecommendationAttachment404:

    def test_create_attachment_award_recommendation_not_found_404(
        self, client, db_session, agency, s3_config
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        pending_file = make_pending_file(user, s3_config)
        missing_id = uuid.uuid4()

        resp = client.post(
            f"{API_URL}/{missing_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 404
        assert resp.json["message"] == f"Could not find Award Recommendation with ID {missing_id}"

    def test_create_attachment_pending_file_not_found_404(
        self, client, db_session, agency, award_recommendation
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        missing_id = uuid.uuid4()

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(missing_id),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 404
        assert resp.json["message"] == "Pending file not found"


####################################
# 401 Tests
####################################


class TestCreateAwardRecommendationAttachment401:

    def test_create_attachment_no_token_401(self, client, award_recommendation):
        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            json={
                "pending_file_id": str(uuid.uuid4()),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 401

    def test_create_attachment_invalid_token_401(self, client, award_recommendation):
        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": "invalid-token"},
            json={
                "pending_file_id": str(uuid.uuid4()),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestCreateAwardRecommendationAttachment403:

    def test_create_attachment_wrong_agency_403(
        self, client, db_session, award_recommendation, s3_config
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=other_agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )
        pending_file = make_pending_file(user, s3_config)

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_create_attachment_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation, s3_config
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_AWARD_RECOMMENDATION],
        )
        pending_file = make_pending_file(user, s3_config)

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_create_attachment_pending_file_belongs_to_other_user_403(
        self, client, db_session, agency, award_recommendation, s3_config
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        other_user = UserFactory.create()
        pending_file = make_pending_file(other_user, s3_config)

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "You do not have permission to access this file"


####################################
# 422 Tests
####################################


class TestCreateAwardRecommendationAttachment422:

    def test_create_attachment_file_scan_not_complete_422(
        self, client, db_session, agency, award_recommendation, s3_config
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        pending_file = make_pending_file(
            user, s3_config, file_scan_status=FileScanStatus.PENDING
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 422
        assert resp.json["message"] == "File cannot be used, status must be complete"

    def test_create_attachment_file_scan_infected_422(
        self, client, db_session, agency, award_recommendation, s3_config
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        pending_file = make_pending_file(
            user, s3_config, file_scan_status=FileScanStatus.INFECTED
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 422
        assert resp.json["message"] == "File cannot be used, status must be complete"

    def test_create_attachment_missing_type_422(
        self, client, db_session, agency, award_recommendation, s3_config
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        pending_file = make_pending_file(user, s3_config)

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
            },
        )

        assert resp.status_code == 422
        assert resp.json["message"] == "Validation error"
        assert any(
            error["field"] == "award_recommendation_attachment_type" for error in resp.json["errors"]
        )

    def test_create_attachment_invalid_type_422(
        self, client, db_session, agency, award_recommendation, s3_config
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        pending_file = make_pending_file(user, s3_config)

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "pending_file_id": str(pending_file.pending_file_id),
                "award_recommendation_attachment_type": "not_a_valid_type",
            },
        )

        assert resp.status_code == 422
        assert resp.json["message"] == "Validation error"
        assert any(
            error["field"] == "award_recommendation_attachment_type" for error in resp.json["errors"]
        )

    def test_create_attachment_missing_pending_file_id_422(
        self, client, db_session, agency, award_recommendation
    ):
        _, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/attachments",
            headers={"X-SGG-Token": token},
            json={
                "award_recommendation_attachment_type": AwardRecommendationAttachmentType.OTHER,
            },
        )

        assert resp.status_code == 422
        assert resp.json["message"] == "Validation error"
        assert any(error["field"] == "pending_file_id" for error in resp.json["errors"])
