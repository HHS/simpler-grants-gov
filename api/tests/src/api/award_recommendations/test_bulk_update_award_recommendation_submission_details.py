import pytest
from decimal import Decimal
from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    AwardRecommendationStatus,
    AwardRecommendationType,
    Privilege,
)
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    AwardRecommendationApplicationSubmissionFactory,
    AwardRecommendationFactory,
    AwardRecommendationSubmissionDetailFactory,
    CompetitionFactory,
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


####################################
# Happy Path Test
####################################


class TestBulkUpdateAwardRecommendationSubmissionDetails200:

    def test_bulk_update_award_recommendation_submission_details_by_detail_id_200(
        self,
        client,
        db_session,
        agency,
        opportunity,
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.UPDATE_AWARD_RECOMMENDATION,
                Privilege.VIEW_AWARD_RECOMMENDATION,
            ],
        )

        competition_1 = CompetitionFactory.create(opportunity=opportunity)
        competition_2 = CompetitionFactory.create(opportunity=opportunity)

        application_1 = ApplicationFactory.create(competition=competition_1)
        application_2 = ApplicationFactory.create(competition=competition_2)

        application_submission_1 = ApplicationSubmissionFactory.create(
            application=application_1,
            total_requested_amount=Decimal("1000.00"),
        )

        application_submission_2 = ApplicationSubmissionFactory.create(
            application=application_2,
            total_requested_amount=Decimal("2000.00"),
        )

        award_recommendation_1 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.IN_REVIEW,
            is_deleted=False,
            review_workflow=None,
            review_workflow_id=None,
        )

        award_recommendation_2 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.IN_REVIEW,
            is_deleted=False,
            review_workflow=None,
            review_workflow_id=None,
        )

        submission_detail_1 = AwardRecommendationSubmissionDetailFactory.create(
            award_recommendation_type=AwardRecommendationType.NOT_RECOMMENDED,
            has_exception=False,
            general_comment="Original general comment 1",
            exception_detail="Original exception detail 1",
            recommended_amount=Decimal("100.00"),
        )

        submission_detail_2 = AwardRecommendationSubmissionDetailFactory.create(
            award_recommendation_type=AwardRecommendationType.NOT_RECOMMENDED,
            has_exception=False,
            general_comment="Original general comment 2",
            exception_detail="Original exception detail 2",
            recommended_amount=Decimal("200.00"),
        )

        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation_1,
            application_submission=application_submission_1,
            award_recommendation_submission_detail=submission_detail_1,
        )

        AwardRecommendationApplicationSubmissionFactory.create(
            award_recommendation=award_recommendation_2,
            application_submission=application_submission_2,
            award_recommendation_submission_detail=submission_detail_2,
        )

        update_data = {
            "record_ids": [
                str(submission_detail_1.award_recommendation_submission_detail_id),
                str(submission_detail_2.award_recommendation_submission_detail_id),
            ],
            "bulk_field_updates": {
                "award_recommendation_type": AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
                "has_exception": True,
                "general_comment": "Updated general comment",
                "exception_detail": "Updated exception detail",
            },
            "individual_updates": {
                str(submission_detail_1.award_recommendation_submission_detail_id): {
                    "recommended_amount": 500000,
                },
                str(submission_detail_2.award_recommendation_submission_detail_id): {
                    "recommended_amount": 1000000,
                },
            },
        }

        resp = client.put(
            f"{API_URL}/submission-details/bulk",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200

        data = resp.json["data"]
        assert len(data) == 2

        response_by_id = {
            item["award_recommendation_submission_detail_id"]: item
            for item in data
        }

        detail_1_data = response_by_id[
            str(submission_detail_1.award_recommendation_submission_detail_id)
        ]
        detail_2_data = response_by_id[
            str(submission_detail_2.award_recommendation_submission_detail_id)
        ]

        assert detail_1_data["award_recommendation_type"] == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        assert detail_1_data["has_exception"] is True
        assert detail_1_data["general_comment"] == "Updated general comment"
        assert detail_1_data["exception_detail"] == "Updated exception detail"
        assert detail_1_data["recommended_amount"] in [
            500000,
            "500000",
            "500000.00",
        ]

        assert detail_2_data["award_recommendation_type"] == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        assert detail_2_data["has_exception"] is True
        assert detail_2_data["general_comment"] == "Updated general comment"
        assert detail_2_data["exception_detail"] == "Updated exception detail"
        assert detail_2_data["recommended_amount"] in [
            1000000,
            "1000000",
            "1000000.00",
        ]

        db_session.refresh(submission_detail_1)
        db_session.refresh(submission_detail_2)
        db_session.refresh(award_recommendation_1)
        db_session.refresh(award_recommendation_2)

        assert submission_detail_1.award_recommendation_type == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        assert submission_detail_1.has_exception is True
        assert submission_detail_1.general_comment == "Updated general comment"
        assert submission_detail_1.exception_detail == "Updated exception detail"
        assert submission_detail_1.recommended_amount == 500000

        assert submission_detail_2.award_recommendation_type == AwardRecommendationType.RECOMMENDED_FOR_FUNDING
        assert submission_detail_2.has_exception is True
        assert submission_detail_2.general_comment == "Updated general comment"
        assert submission_detail_2.exception_detail == "Updated exception detail"
        assert submission_detail_2.recommended_amount == 1000000
