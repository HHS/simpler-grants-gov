import random
import uuid
from datetime import datetime, timezone

import pytest

from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    AwardRecommendationStatus,
    Privilege,
)
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    AwardRecommendationAuditFactory,
    AwardRecommendationFactory,
    LinkExternalUserFactory,
    OpportunityFactory,
    UserFactory,
)

API_URL = "/alpha/award-recommendations"

DEFAULT_PAGINATION = {"pagination": {"page_offset": 1, "page_size": 25}}


def _make_datetime(hour: int) -> datetime:
    return datetime(2026, 4, 1, hour, 0, 0, tzinfo=timezone.utc)


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
# Happy Path Tests
####################################


class TestListAwardRecommendationAudit200:

    def test_audit_list_empty_200(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 200
        assert resp.json["data"] == []
        assert resp.json["pagination_info"]["total_records"] == 0
        assert resp.json["pagination_info"]["total_pages"] == 0

    def test_audit_list_with_various_events_200(
        self, client, db_session, agency, award_recommendation
    ):
        user_with_profile = UserFactory.create(with_profile=True)
        user_with_email = LinkExternalUserFactory.create().user

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        # Create events with different types and ascending timestamps
        create_event = AwardRecommendationAuditFactory.create(
            award_recommendation=award_recommendation,
            user=user_with_profile,
            is_created=True,
            created_at=_make_datetime(hour=1),
        )

        attachment_event = AwardRecommendationAuditFactory.create(
            award_recommendation=award_recommendation,
            user=user_with_email,
            is_attachment_created=True,
            created_at=_make_datetime(hour=2),
        )

        risk_event = AwardRecommendationAuditFactory.create(
            award_recommendation=award_recommendation,
            user=user_with_profile,
            is_risk_created=True,
            created_at=_make_datetime(hour=3),
        )

        review_event = AwardRecommendationAuditFactory.create(
            award_recommendation=award_recommendation,
            user=user_with_email,
            is_review_created=True,
            created_at=_make_datetime(hour=4),
        )

        app_sub_event = AwardRecommendationAuditFactory.create(
            award_recommendation=award_recommendation,
            user=user_with_profile,
            is_application_submission_updated=True,
            created_at=_make_datetime(hour=5),
        )

        events = [
            create_event,
            attachment_event,
            risk_event,
            review_event,
            app_sub_event,
        ]

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 200
        results = resp.json["data"]
        assert len(results) == len(events)

        # Default sort is descending by created_at, so reverse the events
        for result, event in zip(results, events[::-1], strict=True):
            assert result["award_recommendation_audit_id"] == str(
                event.award_recommendation_audit_id
            )
            assert (
                result["award_recommendation_audit_event"] == event.award_recommendation_audit_event
            )
            assert result["created_at"] == event.created_at.isoformat()
            assert result["user"] == {
                "user_id": str(event.user_id),
                "email": event.user.email,
                "first_name": event.user.first_name,
                "last_name": event.user.last_name,
            }

        # Verify the create event has no related entities
        create_result = results[-1]
        assert create_result["award_recommendation_risk"] is None
        assert create_result["award_recommendation_attachment"] is None
        assert create_result["award_recommendation_review"] is None
        assert create_result["award_recommendation_application_submission"] is None
        assert create_result["workflow_approval"] is None

        # Verify the attachment event has attachment data
        attachment_result = results[-2]
        assert attachment_result["award_recommendation_attachment"] is not None
        assert (
            "award_recommendation_attachment_id"
            in attachment_result["award_recommendation_attachment"]
        )
        assert "file_name" in attachment_result["award_recommendation_attachment"]

        # Verify the risk event has risk data
        risk_result = results[-3]
        assert risk_result["award_recommendation_risk"] is not None
        assert "award_recommendation_risk_id" in risk_result["award_recommendation_risk"]

        # Verify the review event has review data
        review_result = results[-4]
        assert review_result["award_recommendation_review"] is not None
        assert "award_recommendation_review_id" in review_result["award_recommendation_review"]

        # Verify the application submission event has submission data
        app_sub_result = results[-5]
        assert app_sub_result["award_recommendation_application_submission"] is not None
        assert (
            "application_submission_id"
            in app_sub_result["award_recommendation_application_submission"]
        )

        pagination = resp.json["pagination_info"]
        assert pagination["total_records"] == len(events)
        assert pagination["sort_order"] == [
            {"order_by": "created_at", "sort_direction": "descending"}
        ]

    def test_audit_list_filter_event_200(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        # Create a variable number of events for each type except REVIEW_DELETED
        events_map = {}
        for event_type in AwardRecommendationAuditEvent:
            if event_type != AwardRecommendationAuditEvent.REVIEW_DELETED:
                audit_events = AwardRecommendationAuditFactory.create_batch(
                    size=random.randint(1, 3),
                    award_recommendation=award_recommendation,
                    award_recommendation_audit_event=event_type,
                )
                events_map[event_type] = audit_events

        event_groups = [
            # All events
            list(AwardRecommendationAuditEvent),
            # Two specific events
            [
                AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_CREATED,
                AwardRecommendationAuditEvent.ATTACHMENT_CREATED,
            ],
            # Single event
            [AwardRecommendationAuditEvent.RISK_CREATED],
            # No results expected
            [AwardRecommendationAuditEvent.REVIEW_DELETED],
        ]

        for event_group in event_groups:
            resp = client.post(
                f"{API_URL}/{award_recommendation.award_recommendation_id}/audit_history",
                json={
                    "pagination": {"page_offset": 1, "page_size": 250},
                    "filters": {"award_recommendation_audit_event": {"one_of": event_group}},
                },
                headers={"X-SGG-Token": token},
            )

            assert resp.status_code == 200
            results = resp.json["data"]

            audit_ids = {audit_event["award_recommendation_audit_id"] for audit_event in results}

            expected_audit_ids = set()
            for event_type in event_group:
                expected_audit_ids.update(
                    str(audit_event.award_recommendation_audit_id)
                    for audit_event in events_map.get(event_type, [])
                )

            assert len(audit_ids) == len(expected_audit_ids)
            assert audit_ids == expected_audit_ids

    def test_audit_list_pagination_200(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        audit_events = []
        # Count down so it matches the default descending sort
        for i in range(10, 1, -1):
            audit_events.append(
                AwardRecommendationAuditFactory.create(
                    award_recommendation=award_recommendation,
                    created_at=_make_datetime(hour=i),
                )
            )

        scenarios = [
            # Fetch everything
            ({"page_offset": 1, "page_size": 25}, audit_events),
            # Fetch everything, reversed
            (
                {
                    "page_offset": 1,
                    "page_size": 25,
                    "sort_order": [{"order_by": "created_at", "sort_direction": "ascending"}],
                },
                audit_events[::-1],
            ),
            # Second page
            ({"page_offset": 2, "page_size": 3}, audit_events[3:6]),
            # Past all events
            ({"page_offset": 10, "page_size": 10}, []),
        ]

        for pagination, expected_audit_events in scenarios:
            resp = client.post(
                f"{API_URL}/{award_recommendation.award_recommendation_id}/audit_history",
                json={"pagination": pagination},
                headers={"X-SGG-Token": token},
            )

            assert resp.status_code == 200
            results = resp.json["data"]

            audit_ids = [e["award_recommendation_audit_id"] for e in results]
            expected_audit_ids = [
                str(e.award_recommendation_audit_id) for e in expected_audit_events
            ]
            assert len(audit_ids) == len(
                expected_audit_ids
            ), f"Mismatch for scenario with pagination {pagination}"
            assert (
                audit_ids == expected_audit_ids
            ), f"Mismatch for scenario with pagination {pagination}"


####################################
# 404 Tests
####################################


class TestListAwardRecommendationAudit404:

    def test_audit_list_not_found_404(self, client, db_session, agency, enable_factory_create):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 404

    def test_audit_list_deleted_award_rec_404(self, client, db_session, agency, opportunity):
        ar = AwardRecommendationFactory.create(
            opportunity=opportunity,
            is_deleted=True,
            review_workflow=None,
            review_workflow_id=None,
        )

        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{ar.award_recommendation_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 404


####################################
# 401 Tests
####################################


class TestListAwardRecommendationAudit401:

    def test_audit_list_no_token_401(self, client, enable_factory_create):
        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/audit_history",
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 401

    def test_audit_list_invalid_token_401(self, client, enable_factory_create):
        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/audit_history",
            headers={"X-SGG-Token": "invalid-token"},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 401


####################################
# 403 Tests
####################################


class TestListAwardRecommendationAudit403:

    def test_audit_list_wrong_agency_403(
        self, client, db_session, award_recommendation, enable_factory_create
    ):
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_audit_list_wrong_privilege_403(self, client, db_session, agency, award_recommendation):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        resp = client.post(
            f"{API_URL}/{award_recommendation.award_recommendation_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


####################################
# 422 Tests
####################################


class TestListAwardRecommendationAudit422:

    def test_audit_list_missing_pagination_422(
        self, client, db_session, agency, enable_factory_create
    ):
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_AWARD_RECOMMENDATION]
        )

        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/audit_history",
            json={},
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 422
        assert resp.json["message"] == "Validation error"
        assert resp.json["errors"] == [
            {
                "field": "pagination",
                "message": "Missing data for required field.",
                "type": "required",
                "value": None,
            }
        ]
