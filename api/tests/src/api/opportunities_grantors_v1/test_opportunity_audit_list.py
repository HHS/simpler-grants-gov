import uuid
from datetime import datetime, timezone

import pytest

from src.constants.lookup_constants import OpportunityAuditEvent, Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import AgencyFactory, OpportunityAuditFactory, OpportunityFactory

API_URL = "/v1/grantors/opportunities"

DEFAULT_PAGINATION = {"pagination": {"page_offset": 1, "page_size": 25}}


def _make_datetime(hour: int) -> datetime:
    return datetime(2026, 7, 1, hour, 0, 0, tzinfo=timezone.utc)


####################################
# Fixtures
####################################


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    """Create a user with VIEW_OPPORTUNITY and UPDATE_OPPORTUNITY permissions"""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.UPDATE_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def opportunity(grantor_auth_data, enable_factory_create):
    """Create an opportunity in the user's agency"""
    _, agency, _, _ = grantor_auth_data
    return OpportunityFactory.create(agency_id=agency.agency_id, agency_code=agency.agency_code)


####################################
# 200 Tests
####################################


class TestListOpportunityAudit200:

    def test_audit_list_empty_200(self, client, db_session, grantor_auth_data, opportunity):
        """No audit rows returns empty list"""
        _, _, token, _ = grantor_auth_data

        resp = client.post(
            f"{API_URL}/{opportunity.opportunity_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 200
        assert resp.json["data"] == []
        assert resp.json["pagination_info"]["total_records"] == 0
        assert resp.json["pagination_info"]["total_pages"] == 0

    def test_audit_list_all_event_types_200(
        self, client, db_session, grantor_auth_data, opportunity
    ):
        """Returns all 6 event types in descending order with correct JSONB columns"""
        _, _, token, _ = grantor_auth_data

        opp_created = OpportunityAuditFactory.create(
            opportunity=opportunity,
            is_opportunity_created=True,
            opportunity_data={"title": "Test"},
            created_at=_make_datetime(hour=1),
        )
        opp_updated = OpportunityAuditFactory.create(
            opportunity=opportunity,
            is_opportunity_updated=True,
            opportunity_data={"title": "Updated"},
            created_at=_make_datetime(hour=2),
        )
        summary_created = OpportunityAuditFactory.create(
            opportunity=opportunity,
            is_summary_created=True,
            nonforecast_opportunity_summary={"summary_description": "Initial"},
            created_at=_make_datetime(hour=3),
        )
        summary_updated = OpportunityAuditFactory.create(
            opportunity=opportunity,
            is_summary_updated=True,
            nonforecast_opportunity_summary={"summary_description": "Updated"},
            created_at=_make_datetime(hour=4),
        )
        competition_created = OpportunityAuditFactory.create(
            opportunity=opportunity,
            is_competition_created=True,
            competition={"competition_title": "Initial"},
            created_at=_make_datetime(hour=5),
        )
        competition_updated = OpportunityAuditFactory.create(
            opportunity=opportunity,
            is_competition_updated=True,
            competition={"competition_title": "Updated"},
            created_at=_make_datetime(hour=6),
        )

        events_asc = [
            opp_created,
            opp_updated,
            summary_created,
            summary_updated,
            competition_created,
            competition_updated,
        ]

        resp = client.post(
            f"{API_URL}/{opportunity.opportunity_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 200
        results = resp.json["data"]
        assert len(results) == 6

        # Default sort is descending by created_at
        for result, event in zip(results, events_asc[::-1], strict=True):
            assert result["opportunity_audit_id"] == str(event.opportunity_audit_id)
            assert result["opportunity_audit_event"] == event.opportunity_audit_event
            assert result["created_at"] == event.created_at.isoformat()
            assert result["user"] == {
                "user_id": str(event.user_id),
                "email": event.user.email,
                "first_name": event.user.first_name,
                "last_name": event.user.last_name,
            }

        # Verify JSONB columns: only the relevant column is non-None per row
        # Results are descending, so index 0 = competition_updated, index 5 = opp_created
        comp_updated_result = results[0]
        assert comp_updated_result["competition"] is not None
        assert comp_updated_result["opportunity"] is None
        assert comp_updated_result["nonforecast_opportunity_summary"] is None

        opp_created_result = results[5]
        assert opp_created_result["opportunity"] is not None
        assert opp_created_result["competition"] is None
        assert opp_created_result["nonforecast_opportunity_summary"] is None

        summary_created_result = results[3]
        assert summary_created_result["nonforecast_opportunity_summary"] is not None
        assert summary_created_result["opportunity"] is None
        assert summary_created_result["competition"] is None

        pagination = resp.json["pagination_info"]
        assert pagination["total_records"] == 6
        assert pagination["sort_order"] == [
            {"order_by": "created_at", "sort_direction": "descending"}
        ]

    def test_audit_list_filter_event_200(self, client, db_session, grantor_auth_data, opportunity):
        """Filtering by event type returns only matching rows"""
        _, _, token, _ = grantor_auth_data

        events_map = {}
        for event_type in OpportunityAuditEvent:
            audit_event = OpportunityAuditFactory.create(
                opportunity=opportunity,
                opportunity_audit_event=event_type,
            )
            events_map[event_type] = audit_event

        scenarios = [
            # All events
            list(OpportunityAuditEvent),
            # Two specific events
            [OpportunityAuditEvent.OPPORTUNITY_CREATED, OpportunityAuditEvent.COMPETITION_UPDATED],
            # Single event
            [OpportunityAuditEvent.OPPORTUNITY_SUMMARY_CREATED],
        ]

        for event_group in scenarios:
            resp = client.post(
                f"{API_URL}/{opportunity.opportunity_id}/audit_history",
                json={
                    "pagination": {"page_offset": 1, "page_size": 25},
                    "filters": {"opportunity_audit_event": {"one_of": event_group}},
                },
                headers={"X-SGG-Token": token},
            )

            assert resp.status_code == 200
            results = resp.json["data"]

            result_ids = {r["opportunity_audit_id"] for r in results}
            expected_ids = {
                str(events_map[event_type].opportunity_audit_id) for event_type in event_group
            }

            assert len(result_ids) == len(expected_ids)
            assert result_ids == expected_ids

    def test_audit_list_pagination_200(self, client, db_session, grantor_auth_data, opportunity):
        """Pagination and sort order work correctly"""
        _, _, token, _ = grantor_auth_data

        # Create 9 events with descending timestamps to match default descending sort
        audit_events = []
        for i in range(9, 0, -1):
            audit_events.append(
                OpportunityAuditFactory.create(
                    opportunity=opportunity,
                    created_at=_make_datetime(hour=i),
                )
            )

        scenarios = [
            # Fetch all (descending)
            ({"page_offset": 1, "page_size": 25}, audit_events),
            # Ascending sort
            (
                {
                    "page_offset": 1,
                    "page_size": 25,
                    "sort_order": [{"order_by": "created_at", "sort_direction": "ascending"}],
                },
                audit_events[::-1],
            ),
            # Second page of 3
            ({"page_offset": 2, "page_size": 3}, audit_events[3:6]),
            # Past the end
            ({"page_offset": 10, "page_size": 10}, []),
        ]

        for pagination, expected_events in scenarios:
            resp = client.post(
                f"{API_URL}/{opportunity.opportunity_id}/audit_history",
                json={"pagination": pagination},
                headers={"X-SGG-Token": token},
            )

            assert resp.status_code == 200
            result_ids = [r["opportunity_audit_id"] for r in resp.json["data"]]
            expected_ids = [str(e.opportunity_audit_id) for e in expected_events]
            assert result_ids == expected_ids, f"Mismatch for pagination {pagination}"


####################################
# 401 Tests
####################################


class TestListOpportunityAudit401:

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


class TestListOpportunityAudit403:

    def test_audit_list_wrong_agency_403(
        self, client, db_session, enable_factory_create, opportunity
    ):
        """User from a different agency cannot view the audit history"""
        other_agency = AgencyFactory.create()
        _, _, token, _ = create_user_in_agency_with_jwt_and_api_key(
            db_session=db_session,
            agency=other_agency,
            privileges=[Privilege.VIEW_OPPORTUNITY],
        )

        resp = client.post(
            f"{API_URL}/{opportunity.opportunity_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"

    def test_audit_list_no_privilege_403(
        self, client, db_session, enable_factory_create, opportunity, grantor_auth_data
    ):
        """User in the same agency but with no privileges gets 403"""
        _, agency, _, _ = grantor_auth_data
        _, _, token, _ = create_user_in_agency_with_jwt_and_api_key(
            db_session=db_session,
            agency=agency,
            privileges=[],
        )

        resp = client.post(
            f"{API_URL}/{opportunity.opportunity_id}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 403
        assert resp.json["message"] == "Forbidden"


####################################
# 404 Tests
####################################


class TestListOpportunityAudit404:

    def test_audit_list_opportunity_not_found_404(
        self, client, db_session, grantor_auth_data, enable_factory_create
    ):
        _, _, token, _ = grantor_auth_data

        resp = client.post(
            f"{API_URL}/{uuid.uuid4()}/audit_history",
            headers={"X-SGG-Token": token},
            json=DEFAULT_PAGINATION,
        )

        assert resp.status_code == 404


####################################
# 422 Tests
####################################


class TestListOpportunityAudit422:

    def test_audit_list_missing_pagination_422(
        self, client, db_session, grantor_auth_data, enable_factory_create
    ):
        _, _, token, _ = grantor_auth_data

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
