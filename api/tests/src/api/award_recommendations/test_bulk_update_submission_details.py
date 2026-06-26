import uuid
from decimal import Decimal

import pytest

from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    AwardRecommendationStatus,
    AwardRecommendationType,
    Privilege,
)
from src.db.models.award_recommendation_models import (
    AwardRecommendationSubmissionDetail,
)
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationApplicationSubmissionFactory,
    AwardRecommendationFactory,
    AwardRecommendationSubmissionDetailFactory,
    OpportunityFactory,
)

API_URL = "/alpha/award-recommendations/submission-details/bulk"


@pytest.fixture
def agency(enable_factory_create):
    return AgencyFactory.create()


@pytest.fixture
def opportunity(agency):
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
def submission_details(award_recommendation):
    detail1 = AwardRecommendationSubmissionDetailFactory.create(
        award_recommendation_type=AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
        recommended_amount=Decimal("100000.00"),
        scoring_comment="Strong proposal",
        general_comment="Well written",
        has_exception=False,
        exception_detail=None,
    )
    AwardRecommendationApplicationSubmissionFactory.create(
        award_recommendation=award_recommendation,
        award_recommendation_submission_detail=detail1,
    )

    detail2 = AwardRecommendationSubmissionDetailFactory.create(
        award_recommendation_type=AwardRecommendationType.NOT_RECOMMENDED,
        recommended_amount=Decimal("0.00"),
        scoring_comment="Low technical merit",
        general_comment="Needs revision",
        has_exception=True,
        exception_detail="Budget concerns",
    )
    AwardRecommendationApplicationSubmissionFactory.create(
        award_recommendation=award_recommendation,
        award_recommendation_submission_detail=detail2,
    )

    return [detail1, detail2]


class TestBulkUpdateSubmissionDetails200:

    def test_bulk_update_with_individual_updates_200(
        self, client, db_session, agency, award_recommendation, submission_details
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )
        db_session.commit()

        detail1, detail2 = submission_details

        request_data = {
            "record_ids": [
                str(detail1.award_recommendation_submission_detail_id),
                str(detail2.award_recommendation_submission_detail_id),
            ],
            "bulk_field_updates": {
                "award_recommendation_type": "recommended_for_funding",
                "has_exception": False,
                "general_comment": "Approved by panel",
                "exception_detail": None,
            },
            "individual_updates": {
                str(detail1.award_recommendation_submission_detail_id): {
                    "recommended_amount": "150000.00"
                },
                str(detail2.award_recommendation_submission_detail_id): {
                    "recommended_amount": "75000.00"
                },
            },
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data) == 2

        db_session.expire_all()

        updated_detail1 = db_session.get(
            AwardRecommendationSubmissionDetail,
            detail1.award_recommendation_submission_detail_id,
        )
        assert (
            updated_detail1.award_recommendation_type
            == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        )
        assert updated_detail1.recommended_amount == Decimal("150000.00")
        assert updated_detail1.general_comment == "Approved by panel"
        assert updated_detail1.has_exception is False
        assert updated_detail1.exception_detail is None

        updated_detail2 = db_session.get(
            AwardRecommendationSubmissionDetail,
            detail2.award_recommendation_submission_detail_id,
        )
        assert (
            updated_detail2.award_recommendation_type
            == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        )
        assert updated_detail2.recommended_amount == Decimal("75000.00")
        assert updated_detail2.general_comment == "Approved by panel"
        assert updated_detail2.has_exception is False

        db_session.refresh(award_recommendation)
        audit_records = [
            event
            for event in award_recommendation.award_recommendation_audit_events
            if event.award_recommendation_audit_event
            == AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_SUBMISSION_UPDATED
        ]
        assert len(audit_records) == 1
        assert audit_records[0].audit_metadata["bulk_update"] is True
        assert audit_records[0].audit_metadata["record_count"] == 2

    def test_bulk_update_only_bulk_fields_200(
        self, client, db_session, agency, award_recommendation, submission_details
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )
        db_session.commit()

        detail1, detail2 = submission_details

        request_data = {
            "record_ids": [
                str(detail1.award_recommendation_submission_detail_id),
                str(detail2.award_recommendation_submission_detail_id),
            ],
            "bulk_field_updates": {
                "award_recommendation_type": "not_recommended",
                "has_exception": True,
                "general_comment": "Insufficient budget",
                "exception_detail": "Over budget limit",
            },
            "individual_updates": {
                str(detail1.award_recommendation_submission_detail_id): {},
                str(detail2.award_recommendation_submission_detail_id): {},
            },
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data) == 2

        db_session.expire_all()

        updated_detail1 = db_session.get(
            AwardRecommendationSubmissionDetail,
            detail1.award_recommendation_submission_detail_id,
        )
        assert updated_detail1.award_recommendation_type == AwardRecommendationType.NOT_RECOMMENDED
        assert updated_detail1.general_comment == "Insufficient budget"
        assert updated_detail1.has_exception is True
        assert updated_detail1.exception_detail == "Over budget limit"
        assert updated_detail1.recommended_amount == Decimal("100000.00")

        updated_detail2 = db_session.get(
            AwardRecommendationSubmissionDetail,
            detail2.award_recommendation_submission_detail_id,
        )
        assert updated_detail2.award_recommendation_type == AwardRecommendationType.NOT_RECOMMENDED
        assert updated_detail2.general_comment == "Insufficient budget"
        assert updated_detail2.has_exception is True

    def test_bulk_update_single_record_200(
        self, client, db_session, agency, award_recommendation, submission_details
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )
        db_session.commit()

        detail1, _ = submission_details

        request_data = {
            "record_ids": [str(detail1.award_recommendation_submission_detail_id)],
            "bulk_field_updates": {
                "award_recommendation_type": "recommended_for_funding",
                "has_exception": None,
                "general_comment": None,
                "exception_detail": None,
            },
            "individual_updates": {
                str(detail1.award_recommendation_submission_detail_id): {
                    "recommended_amount": "200000.00"
                }
            },
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data) == 1

        db_session.expire_all()

        updated_detail1 = db_session.get(
            AwardRecommendationSubmissionDetail,
            detail1.award_recommendation_submission_detail_id,
        )
        assert (
            updated_detail1.award_recommendation_type
            == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        )
        assert updated_detail1.recommended_amount == Decimal("200000.00")


class TestBulkUpdateSubmissionDetails404:

    def test_bulk_update_nonexistent_record_404(
        self, client, db_session, agency, award_recommendation
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )
        db_session.commit()

        fake_id = uuid.uuid4()
        request_data = {
            "record_ids": [str(fake_id)],
            "bulk_field_updates": {"general_comment": "Test"},
            "individual_updates": {str(fake_id): {}},
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 404
        assert "not found" in resp.json["message"].lower()

    def test_bulk_update_partial_missing_records_404(
        self, client, db_session, agency, award_recommendation, submission_details
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )
        db_session.commit()

        detail1, _ = submission_details
        fake_id = uuid.uuid4()

        request_data = {
            "record_ids": [
                str(detail1.award_recommendation_submission_detail_id),
                str(fake_id),
            ],
            "bulk_field_updates": {"general_comment": "Test"},
            "individual_updates": {
                str(detail1.award_recommendation_submission_detail_id): {},
                str(fake_id): {},
            },
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 404
        assert "not found" in resp.json["message"].lower()


class TestBulkUpdateSubmissionDetails422:

    def test_bulk_update_no_linked_award_recommendation_422(
        self, client, db_session, agency, enable_factory_create
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )
        db_session.commit()

        orphan_detail = AwardRecommendationSubmissionDetailFactory.create(
            award_recommendation_type=AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
            recommended_amount=Decimal("100000.00"),
        )

        request_data = {
            "record_ids": [str(orphan_detail.award_recommendation_submission_detail_id)],
            "bulk_field_updates": {"general_comment": "Test"},
            "individual_updates": {
                str(orphan_detail.award_recommendation_submission_detail_id): {}
            },
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 422
        assert "No award recommendation found" in resp.json["message"]

    def test_bulk_update_multiple_award_recommendations_422(
        self, client, db_session, agency, opportunity, enable_factory_create
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )

        ar1 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.DRAFT,
            is_deleted=False,
        )
        ar2 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.DRAFT,
            is_deleted=False,
        )

        detail1 = AwardRecommendationSubmissionDetailFactory.create()
        detail2 = AwardRecommendationSubmissionDetailFactory.create()

        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=ar1,
            award_recommendation_submission_detail=detail1,
        )
        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=ar2,
            award_recommendation_submission_detail=detail2,
        )

        db_session.commit()

        request_data = {
            "record_ids": [
                str(detail1.award_recommendation_submission_detail_id),
                str(detail2.award_recommendation_submission_detail_id),
            ],
            "bulk_field_updates": {"general_comment": "Test"},
            "individual_updates": {
                str(detail1.award_recommendation_submission_detail_id): {},
                str(detail2.award_recommendation_submission_detail_id): {},
            },
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 422
        assert "same Award Recommendation" in resp.json["message"]


class TestBulkUpdateSubmissionDetails403:

    def test_bulk_update_wrong_agency_403(
        self, client, db_session, award_recommendation, submission_details, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=other_agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION],
        )
        db_session.commit()

        detail1, _ = submission_details

        request_data = {
            "record_ids": [str(detail1.award_recommendation_submission_detail_id)],
            "bulk_field_updates": {"general_comment": "Test"},
            "individual_updates": {str(detail1.award_recommendation_submission_detail_id): {}},
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_bulk_update_missing_privilege_403(
        self, client, db_session, agency, award_recommendation, submission_details
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_AWARD_RECOMMENDATION],
        )
        db_session.commit()

        detail1, _ = submission_details

        request_data = {
            "record_ids": [str(detail1.award_recommendation_submission_detail_id)],
            "bulk_field_updates": {"general_comment": "Test"},
            "individual_updates": {str(detail1.award_recommendation_submission_detail_id): {}},
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": token})

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


class TestBulkUpdateSubmissionDetails401:

    def test_bulk_update_no_token_401(self, client, submission_details):
        detail1, _ = submission_details

        request_data = {
            "record_ids": [str(detail1.award_recommendation_submission_detail_id)],
            "bulk_field_updates": {"general_comment": "Test"},
            "individual_updates": {str(detail1.award_recommendation_submission_detail_id): {}},
        }

        resp = client.put(API_URL, json=request_data)

        assert resp.status_code == 401
        assert resp.json["message"] == "Unauthorized"

    def test_bulk_update_invalid_token_401(self, client, submission_details):
        detail1, _ = submission_details

        request_data = {
            "record_ids": [str(detail1.award_recommendation_submission_detail_id)],
            "bulk_field_updates": {"general_comment": "Test"},
            "individual_updates": {str(detail1.award_recommendation_submission_detail_id): {}},
        }

        resp = client.put(API_URL, json=request_data, headers={"X-SGG-Token": "invalid"})

        assert resp.status_code == 401
        assert resp.json["message"] == "Unable to process token"
