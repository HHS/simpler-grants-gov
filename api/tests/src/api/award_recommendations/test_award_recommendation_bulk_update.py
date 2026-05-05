import pytest

from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    AwardRecommendationStatus,
    AwardSelectionMethod,
    Privilege,
)
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


####################################
# Happy Path Test
####################################


class TestBulkUpdateAwardRecommendation200:

    def test_bulk_update_award_recommendations_200(self, client, db_session, agency, opportunity):
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[
                Privilege.UPDATE_AWARD_RECOMMENDATION,
                Privilege.VIEW_AWARD_RECOMMENDATION,
            ],
        )

        award_recommendation_1 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.IN_REVIEW,
            award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
            selection_method_detail="Original selection method detail 1",
            additional_info="Original additional info 1",
            funding_strategy="Original funding strategy 1",
            other_key_information="Original key info 1",
            is_deleted=False,
            review_workflow=None,
            review_workflow_id=None,
        )

        award_recommendation_2 = AwardRecommendationFactory.create(
            opportunity=opportunity,
            award_recommendation_status=AwardRecommendationStatus.IN_REVIEW,
            award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
            selection_method_detail="Original selection method detail 2",
            additional_info="Original additional info 2",
            funding_strategy="Original funding strategy 2",
            other_key_information="Original key info 2",
            is_deleted=False,
            review_workflow=None,
            review_workflow_id=None,
        )

        update_data = {
            "record_ids": [
                str(award_recommendation_1.award_recommendation_id),
                str(award_recommendation_2.award_recommendation_id),
            ],
            "updates": {
                "funding_strategy": "Updated funding strategy",
                "additional_info": "Updated additional information",
            },
        }

        resp = client.put(
            f"{API_URL}/bulk",
            json=update_data,
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200

        data = resp.json["data"]
        assert len(data) == 2
        response_by_id = {item["award_recommendation_id"]: item for item in data}

        ar_1_data = response_by_id[str(award_recommendation_1.award_recommendation_id)]
        ar_2_data = response_by_id[str(award_recommendation_2.award_recommendation_id)]

        # Assert updated fields in response
        assert ar_1_data["funding_strategy"] == "Updated funding strategy"
        assert ar_1_data["additional_info"] == "Updated additional information"

        assert ar_2_data["funding_strategy"] == "Updated funding strategy"
        assert ar_2_data["additional_info"] == "Updated additional information"

        # Assert omitted fields were not changed in response
        assert ar_1_data["award_selection_method"] == AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY
        assert ar_1_data["selection_method_detail"] == "Original selection method detail 1"
        assert ar_1_data["other_key_information"] == "Original key info 1"

        assert ar_2_data["award_selection_method"] == AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY
        assert ar_2_data["selection_method_detail"] == "Original selection method detail 2"
        assert ar_2_data["other_key_information"] == "Original key info 2"

        # Verify database was actually updated
        db_session.refresh(award_recommendation_1)
        db_session.refresh(award_recommendation_2)

        assert award_recommendation_1.funding_strategy == "Updated funding strategy"
        assert award_recommendation_1.additional_info == "Updated additional information"
        assert (
            award_recommendation_1.award_selection_method
            == AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY
        )
        assert award_recommendation_1.selection_method_detail == (
            "Original selection method detail 1"
        )
        assert award_recommendation_1.other_key_information == "Original key info 1"

        assert award_recommendation_2.funding_strategy == "Updated funding strategy"
        assert award_recommendation_2.additional_info == "Updated additional information"
        assert (
            award_recommendation_2.award_selection_method
            == AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY
        )
        assert award_recommendation_2.selection_method_detail == (
            "Original selection method detail 2"
        )
        assert award_recommendation_2.other_key_information == "Original key info 2"

        # Verify audit records were created for both updates
        ar_1_audit_records = [
            event
            for event in award_recommendation_1.award_recommendation_audit_events
            if event.award_recommendation_audit_event
            == AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_UPDATED
            and event.user_id == user.user_id
        ]

        ar_2_audit_records = [
            event
            for event in award_recommendation_2.award_recommendation_audit_events
            if event.award_recommendation_audit_event
            == AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_UPDATED
            and event.user_id == user.user_id
        ]

        assert len(ar_1_audit_records) > 0, "No audit record was created for first update"
        assert len(ar_2_audit_records) > 0, "No audit record was created for second update"

        assert ar_1_audit_records[-1].created_at is not None
        assert ar_2_audit_records[-1].created_at is not None

        # Verify GET returns updated data for both award recommendations after bulk update just for sanity check
        get_resp_1 = client.get(
            f"{API_URL}/{award_recommendation_1.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        get_resp_2 = client.get(
            f"{API_URL}/{award_recommendation_2.award_recommendation_id}",
            headers={"X-SGG-Token": token},
        )

        assert get_resp_1.status_code == 200
        assert get_resp_2.status_code == 200

        get_data_1 = get_resp_1.json["data"]
        get_data_2 = get_resp_2.json["data"]

        assert get_data_1["funding_strategy"] == "Updated funding strategy"
        assert get_data_1["additional_info"] == "Updated additional information"

        assert get_data_2["funding_strategy"] == "Updated funding strategy"
        assert get_data_2["additional_info"] == "Updated additional information"

        assert get_data_1["funding_strategy"] == "Updated funding strategy"
        assert get_data_1["additional_info"] == "Updated additional information"

        assert get_data_2["funding_strategy"] == "Updated funding strategy"
        assert get_data_2["additional_info"] == "Updated additional information"

        # updated fields
        assert (
            get_data_1["award_selection_method"] == AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY
        )
        assert get_data_1["selection_method_detail"] == "Original selection method detail 1"
        assert get_data_1["other_key_information"] == "Original key info 1"

        # omitted fields should remain unchanged
        assert (
            get_data_2["award_selection_method"] == AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY
        )
        assert get_data_2["selection_method_detail"] == "Original selection method detail 2"
        assert get_data_2["other_key_information"] == "Original key info 2"
