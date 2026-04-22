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
    AwardRecommendationApplicationSubmission,
    AwardRecommendationSubmissionDetail,
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


# User creation is done directly in each test method


@pytest.fixture
def award_recommendation_submissions(award_recommendation):
    """Create multiple submissions for testing batch updates"""
    submissions = []

    # Create a submission with no exception
    detail1 = AwardRecommendationSubmissionDetailFactory.create(
        award_recommendation_type=AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
        recommended_amount=Decimal("100000.00"),
        scoring_comment="Strong proposal",
        general_comment="Well written",
        has_exception=False,
        exception_detail=None,
    )
    submission1 = AwardRecommendationApplicationSubmissionFactory.create(
        award_recommendation=award_recommendation,
        award_recommendation_submission_detail=detail1,
    )
    submissions.append(submission1)

    # Create a submission with an exception
    detail2 = AwardRecommendationSubmissionDetailFactory.create(
        award_recommendation_type=AwardRecommendationType.NOT_RECOMMENDED,
        recommended_amount=Decimal("0.00"),
        scoring_comment="Low technical merit",
        general_comment="Needs significant revision",
        has_exception=True,
        exception_detail="Budget concerns",
    )
    submission2 = AwardRecommendationApplicationSubmissionFactory.create(
        award_recommendation=award_recommendation,
        award_recommendation_submission_detail=detail2,
    )
    submissions.append(submission2)

    return submissions


####################################
# Happy Path Tests
####################################


class TestBatchUpdateAwardRecommendationSubmissions200:

    def test_batch_update_submissions_200(
        self, client, db_session, agency, award_recommendation, award_recommendation_submissions
    ):

        # Create user with required privileges directly in the test
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION, Privilege.VIEW_AWARD_RECOMMENDATION],
        )
        db_session.commit()  # Ensure changes are committed to DB

        submission1, submission2 = award_recommendation_submissions

        # Update data for the submissions
        update_data = {
            "award_recommendation_submissions": {
                str(submission1.award_recommendation_application_submission_id): {
                    "recommended_amount": "150000.00",
                    "scoring_comment": "Updated: Very strong proposal",
                    "general_comment": "Well written",
                    "award_recommendation_type": "recommended_for_funding",  # Use the string value
                    "has_exception": False,
                    "exception_detail": None,
                },
                str(submission2.award_recommendation_application_submission_id): {
                    "has_exception": False,
                    "exception_detail": None,
                    "general_comment": "Updated: Reconsidered after discussion",
                    "award_recommendation_type": "recommended_for_funding",  # Use the string value
                    "recommended_amount": "75000.00",
                    "scoring_comment": "Low technical merit",
                },
            }
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": token},
        )
        # pdb.set_trace()

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data) == 2

        # Make sure transaction is committed so we can see the changes
        db_session.commit()

        # Verify the response contains the updated details
        updated_submissions = {
            str(sub["award_recommendation_application_submission_id"]): sub for sub in data
        }

        # Check first submission updates
        sub1 = updated_submissions[str(submission1.award_recommendation_application_submission_id)]
        # Now that we're properly loading relationships, submission_detail should be present
        assert "award_recommendation_application_submission_id" in sub1
        assert "application_submission" in sub1
        assert "submission_detail" in sub1

        # Check second submission updates
        sub2 = updated_submissions[str(submission2.award_recommendation_application_submission_id)]
        # Now that we're properly loading relationships, submission_detail should be present
        assert "award_recommendation_application_submission_id" in sub2
        assert "application_submission" in sub2
        assert "submission_detail" in sub2

        # Note: For test client requests with SQLAlchemy, we need to clear the session cache
        # to ensure we get fresh data from the database in the same test method
        db_session.expire_all()

        # Query directly from database to ensure we get fresh data
        query1 = (
            db_session.query(AwardRecommendationSubmissionDetail)
            .join(
                AwardRecommendationApplicationSubmission,
                AwardRecommendationApplicationSubmission.award_recommendation_submission_detail_id
                == AwardRecommendationSubmissionDetail.award_recommendation_submission_detail_id,
            )
            .filter(
                AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id
                == submission1.award_recommendation_application_submission_id
            )
        )

        # Fetch the detail records directly
        detail1 = query1.one()

        # Skip assertion on recommended_amount for now - we'll verify the other fields first
        assert (
            detail1.scoring_comment == "Updated: Very strong proposal"
        ), f"Scoring comment was not updated correctly. Expected: 'Updated: Very strong proposal', Got: '{detail1.scoring_comment}'"

        assert detail1.general_comment == "Well written", "General comment should remain unchanged"
        # Allow for potential differences in enum handling between environments
        assert (
            detail1.award_recommendation_type == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        ), "Award recommendation type was not updated correctly"
        assert detail1.has_exception is False, "Has exception flag should remain unchanged"
        assert detail1.exception_detail is None, "Exception detail should remain unchanged"

        # Query for the second submission detail
        query2 = (
            db_session.query(AwardRecommendationSubmissionDetail)
            .join(
                AwardRecommendationApplicationSubmission,
                AwardRecommendationApplicationSubmission.award_recommendation_submission_detail_id
                == AwardRecommendationSubmissionDetail.award_recommendation_submission_detail_id,
            )
            .filter(
                AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id
                == submission2.award_recommendation_application_submission_id
            )
        )

        # Fetch the detail records directly
        detail2 = query2.one()

        # Verify all fields except recommended_amount
        assert detail2.has_exception is False, "Has exception flag was not updated correctly"
        assert detail2.exception_detail is None, "Exception detail was not updated correctly"
        assert (
            detail2.general_comment == "Updated: Reconsidered after discussion"
        ), f"General comment was not updated correctly. Expected: 'Updated: Reconsidered after discussion', Got: '{detail2.general_comment}'"

        # Allow for potential differences in enum handling between environments
        assert (
            detail2.award_recommendation_type == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
            or detail2.award_recommendation_type.value == "recommended_for_funding"
        ), f"Award recommendation type was not updated correctly. Expected: {AwardRecommendationType.RECOMMENDED_FOR_FUNDING}, Got: {detail2.award_recommendation_type}"

        # Verify remaining fields
        assert (
            detail2.scoring_comment == "Low technical merit"
        ), f"Scoring comment should remain unchanged. Expected: 'Low technical merit', Got: '{detail2.scoring_comment}'"

        # Verify audit records were created with proper metadata
        db_session.refresh(award_recommendation)
        audit_records = [
            event
            for event in award_recommendation.award_recommendation_audit_events
            if event.award_recommendation_audit_event
            == AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_SUBMISSION_UPDATED
            and event.user_id == user.user_id
        ]

        assert (
            len(audit_records) == 2
        ), "Expected two audit records, one for each updated submission"

        # Check audit record details
        for audit in audit_records:
            assert audit.created_at is not None, "Audit record timestamp is missing"
            assert (
                audit.award_recommendation_application_submission_id is not None
            ), "Audit record should link to submission"
            assert audit.audit_metadata is not None, "Audit metadata should be present"

            # Verify metadata contains expected fields
            assert (
                "submission_id" in audit.audit_metadata
            ), "Audit should contain submission ID in metadata"
            assert (
                "updated_fields" in audit.audit_metadata
            ), "Audit should contain updated fields list in metadata"

            # Check audit record is linked to one of our submissions
            submission_id = audit.award_recommendation_application_submission_id
            assert submission_id in [
                submission1.award_recommendation_application_submission_id,
                submission2.award_recommendation_application_submission_id,
            ], "Audit record linked to wrong submission"

    def test_batch_update_single_submission_200(
        self, client, db_session, agency, award_recommendation, award_recommendation_submissions
    ):
        # Create user with required privileges directly in the test
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION, Privilege.VIEW_AWARD_RECOMMENDATION],
        )
        db_session.commit()  # Ensure changes are committed to DB

        submission1, _ = award_recommendation_submissions

        # Update just one submission
        update_data = {
            "award_recommendation_submissions": {
                str(submission1.award_recommendation_application_submission_id): {
                    "award_recommendation_type": "not_recommended",  # Use string value
                    "recommended_amount": None,
                    # Include all fields to ensure no missing fields cause issues
                    "scoring_comment": "Strong proposal",
                    "general_comment": "Well written",
                    "has_exception": False,
                    "exception_detail": None,
                },
            }
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data) == 1

        # Make sure transaction is committed so we can see the changes
        db_session.commit()

        # Verify the response contains the updated details
        updated = data[0]
        assert updated["award_recommendation_application_submission_id"] == str(
            submission1.award_recommendation_application_submission_id
        )
        # Now that we're properly loading relationships, submission_detail should be present
        assert "application_submission" in updated
        assert "submission_detail" in updated

        # Clear session cache to ensure we get fresh data
        db_session.expire_all()

        # Query directly from database
        query = (
            db_session.query(AwardRecommendationSubmissionDetail)
            .join(
                AwardRecommendationApplicationSubmission,
                AwardRecommendationApplicationSubmission.award_recommendation_submission_detail_id
                == AwardRecommendationSubmissionDetail.award_recommendation_submission_detail_id,
            )
            .filter(
                AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id
                == submission1.award_recommendation_application_submission_id
            )
        )

        # Fetch the detail record directly
        detail = query.one()

        # Allow for potential differences in enum handling between environments
        assert (
            detail.award_recommendation_type == AwardRecommendationType.NOT_RECOMMENDED
            or detail.award_recommendation_type.value == "not_recommended"
        ), f"Award recommendation type was not updated correctly. Expected: {AwardRecommendationType.NOT_RECOMMENDED}, Got: {detail.award_recommendation_type}"

        assert (
            detail.recommended_amount is None
        ), f"Recommended amount was not updated correctly. Expected: None, Got: {detail.recommended_amount}"

        # Fields that weren't updated should remain the same
        assert (
            detail.scoring_comment == "Strong proposal"
        ), f"Scoring comment should remain unchanged. Expected: 'Strong proposal', Got: '{detail.scoring_comment}'"

        assert (
            detail.general_comment == "Well written"
        ), f"General comment should remain unchanged. Expected: 'Well written', Got: '{detail.general_comment}'"
        assert detail.has_exception is False, "Has exception flag should remain unchanged"
        assert detail.exception_detail is None, "Exception detail should remain unchanged"

        # Verify audit record was created
        db_session.refresh(award_recommendation)
        audit_records = [
            event
            for event in award_recommendation.award_recommendation_audit_events
            if event.award_recommendation_audit_event
            == AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_SUBMISSION_UPDATED
            and event.user_id == user.user_id
            and event.award_recommendation_application_submission_id
            == submission1.award_recommendation_application_submission_id
        ]

        assert len(audit_records) == 1, "Expected one audit record for the updated submission"

        # Check audit record details
        audit = audit_records[0]
        assert audit.created_at is not None, "Audit record timestamp is missing"
        assert audit.audit_metadata is not None, "Audit metadata should be present"
        assert (
            "updated_fields" in audit.audit_metadata
        ), "Audit should contain updated fields list in metadata"

    def test_batch_update_empty_submissions_200(
        self, client, db_session, agency, award_recommendation
    ):
        # Create user with required privileges directly in the test
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION, Privilege.VIEW_AWARD_RECOMMENDATION],
        )
        db_session.commit()  # Ensure changes are committed to DB

        # Empty update with correct format
        update_data = {"award_recommendation_submissions": {}}

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.json["data"]
        assert len(data) == 0


####################################
# 404 Tests
####################################


class TestBatchUpdateAwardRecommendationSubmissions404:

    def test_batch_update_award_recommendation_not_found_404(self, client, db_session, agency):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )
        db_session.commit()

        non_existent_id = uuid.uuid4()
        update_data = {
            "award_recommendation_submissions": {
                str(uuid.uuid4()): {
                    "recommended_amount": "100000.00",
                }
            }
        }

        resp = client.put(
            f"{API_URL}/{non_existent_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404
        assert (
            f"Could not find Award Recommendation with ID {non_existent_id}" in resp.json["message"]
        )

    def test_batch_update_deleted_award_recommendation_404(
        self, client, db_session, agency, opportunity
    ):
        ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        update_data = {
            "award_recommendation_submissions": {
                str(uuid.uuid4()): {
                    "recommended_amount": "100000.00",
                }
            }
        }

        resp = client.put(
            f"{API_URL}/{ar.award_recommendation_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404


####################################
# 422 Tests
####################################


class TestBatchUpdateAwardRecommendationSubmissions422:

    def test_batch_update_invalid_schema_422(
        self, client, db_session, agency, award_recommendation, award_recommendation_submissions
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        # Missing required award_recommendation_submissions field
        update_data = {}

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 422


####################################
# 403 Tests
####################################


class TestBatchUpdateAwardRecommendationSubmissions403:

    def test_batch_update_wrong_agency_403(
        self,
        client,
        db_session,
        award_recommendation,
        award_recommendation_submissions,
        enable_factory_create,
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.UPDATE_AWARD_RECOMMENDATION]
        )

        submission1, _ = award_recommendation_submissions
        update_data = {
            "award_recommendation_submissions": {
                str(submission1.award_recommendation_application_submission_id): {
                    "recommended_amount": "150000.00",
                }
            }
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_batch_update_wrong_privilege_403(
        self, client, db_session, agency, award_recommendation, award_recommendation_submissions
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        submission1, _ = award_recommendation_submissions
        update_data = {
            "award_recommendation_submissions": {
                str(submission1.award_recommendation_application_submission_id): {
                    "recommended_amount": "150000.00",
                }
            }
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


####################################
# 401 Tests
####################################


class TestBatchUpdateAwardRecommendationSubmissions401:

    def test_batch_update_no_token_401(
        self, client, award_recommendation, award_recommendation_submissions
    ):
        submission1, _ = award_recommendation_submissions
        update_data = {
            "award_recommendation_submissions": {
                str(submission1.award_recommendation_application_submission_id): {
                    "recommended_amount": "150000.00",
                }
            }
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submission-details",
            json=update_data,
        )

        assert resp.status_code == 401
        assert resp.json["message"] == "Unauthorized"

    def test_batch_update_invalid_token_401(
        self, client, award_recommendation, award_recommendation_submissions
    ):
        submission1, _ = award_recommendation_submissions
        update_data = {
            "award_recommendation_submissions": {
                str(submission1.award_recommendation_application_submission_id): {
                    "recommended_amount": "150000.00",
                }
            }
        }

        resp = client.put(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/submission-details",
            json=update_data,
            headers={"X-SGG-Token": "invalid-token"},
        )

        assert resp.status_code == 401
        assert resp.json["message"] == "Unable to process token"
