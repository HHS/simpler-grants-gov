import random
import uuid
from datetime import datetime, timezone

import pytest

from src.constants.lookup_constants import ApplicationAuditEvent, Privilege
from tests.lib.application_test_utils import create_user_in_app
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import (
    ApplicationAuditFactory,
    ApplicationFactory,
    LinkExternalUserFactory,
    UserFactory,
)


def _make_datetime(hour: int) -> datetime:
    """Utility function to setup datetime, just to be slightly less verbose"""
    return datetime(2025, 12, 1, hour, 0, 0, tzinfo=timezone.utc)


@pytest.mark.parametrize("has_organization", [True, False])
def test_list_application_audit_200(client, enable_factory_create, db_session, has_organization):
    user_no_email_profile = UserFactory.create()
    user_with_email = LinkExternalUserFactory.create().user
    user_with_profile = UserFactory.create(with_profile=True)

    user_with_email_and_profile = UserFactory.create(with_profile=True)
    LinkExternalUserFactory.create(user=user_with_email_and_profile)

    app_params = {}
    if has_organization:
        user, org, token = create_user_in_org(
            db_session=db_session, privileges=[Privilege.VIEW_APPLICATION]
        )
        app_params["organization"] = org

    application = ApplicationFactory.create(with_forms=True, with_attachments=True, **app_params)

    app_form = application.application_forms[0]
    attachment = application.application_attachments[0]

    if not has_organization:
        user, _, token = create_user_in_app(
            db_session=db_session, application=application, privileges=[Privilege.VIEW_APPLICATION]
        )

    ### Add audit events of each type
    ### Give them an ascending set of timestamps so they get returned in this order

    # Create
    create_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_email_and_profile,
        is_create=True,
        created_at=_make_datetime(hour=1),
    )

    # App name changed
    name_change_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_profile,
        is_name_changed=True,
        created_at=_make_datetime(hour=2),
    )

    # Attachment add/update/delete
    attachment_add_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_email,
        is_attachment_added=True,
        target_attachment=attachment,
        created_at=_make_datetime(hour=3),
    )
    attachment_update_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_email,
        is_attachment_added=True,
        target_attachment=attachment,
        created_at=_make_datetime(hour=4),
    )
    attachment_delete_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_email_and_profile,
        is_attachment_deleted=True,
        created_at=_make_datetime(hour=5),
    )

    # User added/updated/removed
    user_add_event = ApplicationAuditFactory.create(
        application=application,
        user=user_no_email_profile,
        target_user=user_with_email,
        is_user_added=True,
        created_at=_make_datetime(hour=6),
    )
    user_update_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_profile,
        target_user=user_with_email,
        is_user_updated=True,
        created_at=_make_datetime(hour=7),
    )
    user_delete_event = ApplicationAuditFactory.create(
        application=application,
        user=user_no_email_profile,
        target_user=user_with_email,
        is_user_removed=True,
        created_at=_make_datetime(hour=8),
    )

    # Update form
    form_update_event = ApplicationAuditFactory.create(
        application=application,
        user=user_no_email_profile,
        target_application_form=app_form,
        is_form_updated=True,
        created_at=_make_datetime(hour=9),
    )

    # Submit rejected
    submit_rejected_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_profile,
        is_submit_rejected=True,
        created_at=_make_datetime(hour=10),
    )

    # Submit
    submit_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_profile,
        is_submit=True,
        created_at=_make_datetime(hour=11),
    )

    # Submission created
    submission_event = ApplicationAuditFactory.create(
        application=application,
        user=user_with_profile,
        is_submission_created=True,
        created_at=_make_datetime(hour=12),
    )

    events = [
        create_event,
        name_change_event,
        attachment_add_event,
        attachment_update_event,
        attachment_delete_event,
        user_add_event,
        user_update_event,
        user_delete_event,
        form_update_event,
        submit_rejected_event,
        submit_event,
        submission_event,
    ]

    response = client.post(
        f"/alpha/applications/{application.application_id}/audit_history",
        json={"pagination": {"page_offset": 1, "page_size": 25}},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    results = response.json["data"]
    assert len(results) == len(events)

    # We reverse the events as we get latest events first
    for resp, event in zip(results, events[::-1], strict=True):
        assert resp["application_audit_id"] == str(event.application_audit_id)
        assert resp["application_audit_event"] == event.application_audit_event
        assert resp["created_at"] == event.created_at.isoformat()
        assert resp["user"] == {
            "user_id": str(event.user_id),
            "email": event.user.email,
            "first_name": event.user.first_name,
            "last_name": event.user.last_name,
        }

        if event.target_user:
            assert resp["target_user"] == {
                "user_id": str(event.target_user.user_id),
                "email": event.target_user.email,
                "first_name": event.target_user.first_name,
                "last_name": event.target_user.last_name,
            }
        else:
            assert resp["target_user"] is None

        if event.target_application_form:
            assert resp["target_application_form"] == {
                "application_form_id": str(event.target_application_form.application_form_id),
                "competition_form_id": str(event.target_application_form.competition_form_id),
                "form_id": str(event.target_application_form.form.form_id),
                "form_name": event.target_application_form.form.form_name,
            }
        else:
            assert resp["target_application_form"] is None

        if event.target_attachment:
            assert resp["target_attachment"] == {
                "application_attachment_id": str(event.target_attachment_id),
                "file_name": event.target_attachment.file_name,
                "is_deleted": event.target_attachment.is_deleted,
            }
        else:
            assert resp["target_attachment"] is None

    pagination = response.json["pagination_info"]
    assert pagination == {
        "page_offset": 1,
        "page_size": 25,
        "total_pages": 1,
        "total_records": len(events),
        "sort_order": [
            {"order_by": "created_at", "sort_direction": "descending"},
        ],
    }


def test_list_application_audit_filter_event_200(client, enable_factory_create, db_session):
    user, application, token = create_user_in_app(
        db_session=db_session, privileges=[Privilege.VIEW_APPLICATION]
    )

    # For every event type, add a variable number of events
    # except for SUBMISSION_CREATED which we'll hold back to verify it doesn't get returned
    events_map = {}
    for event_type in ApplicationAuditEvent:
        if event_type != ApplicationAuditEvent.SUBMISSION_CREATED:
            # We aren't worrying about the various additional fields being logical
            # since we've tested those in other tests, just want to verify the filter
            application_audit_events = ApplicationAuditFactory.create_batch(
                size=random.randint(1, 3),
                application=application,
                application_audit_event=event_type,
            )
            events_map[event_type] = application_audit_events

    # call the endpoint with various groups of events and verify just those
    # event types get returned. We don't have this be several tests because
    # the setup above is pretty costly in time.
    event_groups = [
        # All events
        [e for e in ApplicationAuditEvent],
        [ApplicationAuditEvent.APPLICATION_NAME_CHANGED, ApplicationAuditEvent.APPLICATION_CREATED],
        [ApplicationAuditEvent.ATTACHMENT_DELETED, ApplicationAuditEvent.USER_ADDED],
        [
            ApplicationAuditEvent.ORGANIZATION_ADDED,
            ApplicationAuditEvent.USER_REMOVED,
            ApplicationAuditEvent.USER_UPDATED,
        ],
        # No results expected
        [ApplicationAuditEvent.SUBMISSION_CREATED],
    ]

    for event_group in event_groups:
        response = client.post(
            f"/alpha/applications/{application.application_id}/audit_history",
            json={
                "pagination": {"page_offset": 1, "page_size": 250},
                "filters": {"application_audit_event": {"one_of": event_group}},
            },
            headers={"X-SGG-Token": token},
        )

        assert response.status_code == 200
        results = response.json["data"]

        audit_events = {audit_event["application_audit_id"] for audit_event in results}

        expected_audit_ids = set()
        for event_type in event_group:
            expected_audit_ids.update(
                str(audit_event.application_audit_id)
                for audit_event in events_map.get(event_type, [])
            )

        assert len(audit_events) == len(expected_audit_ids)
        assert audit_events == expected_audit_ids


def test_list_application_audit_pagination_200(client, enable_factory_create, db_session):
    user, application, token = create_user_in_app(
        db_session=db_session, privileges=[Privilege.VIEW_APPLICATION]
    )

    audit_events = []
    # Count down so it matches the order of the default sorting
    for i in range(10, 1, -1):
        audit_events.append(
            ApplicationAuditFactory.create(
                application=application,
                created_at=_make_datetime(hour=i),
            )
        )

    # Each scenario is a tuple of the pagination object + expected results
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
        # Second page, starting from 4th item (index 3)
        ({"page_offset": 2, "page_size": 3}, audit_events[3:6]),
        # Past all events
        ({"page_offset": 10, "page_size": 10}, []),
        # Reversed middle page
        (
            {
                "page_offset": 3,
                "page_size": 2,
                "sort_order": [{"order_by": "created_at", "sort_direction": "ascending"}],
            },
            audit_events[-5:-7:-1],
        ),
    ]

    for pagination, expected_audit_events in scenarios:

        response = client.post(
            f"/alpha/applications/{application.application_id}/audit_history",
            json={"pagination": pagination},
            headers={"X-SGG-Token": token},
        )

        assert response.status_code == 200
        results = response.json["data"]

        audit_ids = [audit_event["application_audit_id"] for audit_event in results]
        expected_audit_ids = [
            str(audit_event.application_audit_id) for audit_event in expected_audit_events
        ]
        assert len(audit_ids) == len(
            expected_audit_ids
        ), f"Mismatch for scenario with pagination {pagination}"
        assert (
            audit_ids == expected_audit_ids
        ), f"Mismatch for scenario with pagination {pagination}"


@pytest.mark.parametrize("has_organization", [True, False])
def test_list_application_audit_empty_result_200(
    client, enable_factory_create, db_session, has_organization
):
    app_params = {}
    if has_organization:
        user, org, token = create_user_in_org(
            db_session=db_session, privileges=[Privilege.VIEW_APPLICATION]
        )
        app_params["organization"] = org

    application = ApplicationFactory.create(with_forms=True, with_attachments=True, **app_params)

    if not has_organization:
        user, _, token = create_user_in_app(
            db_session=db_session, application=application, privileges=[Privilege.VIEW_APPLICATION]
        )

    response = client.post(
        f"/alpha/applications/{application.application_id}/audit_history",
        json={"pagination": {"page_offset": 1, "page_size": 25}},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["data"] == []


def test_list_application_audit_not_in_app_403(client, enable_factory_create, db_session):
    application = ApplicationFactory.create()

    user, _different_app, token = create_user_in_app(
        db_session=db_session, privileges=[Privilege.VIEW_APPLICATION]
    )

    response = client.post(
        f"/alpha/applications/{application.application_id}/audit_history",
        json={"pagination": {"page_offset": 1, "page_size": 25}},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_list_application_audit_in_app_missing_right_privilege_403(
    client, enable_factory_create, db_session
):
    application = ApplicationFactory.create()
    user, _different_app, token = create_user_in_app(
        db_session=db_session, application=application, privileges=[Privilege.START_APPLICATION]
    )

    response = client.post(
        f"/alpha/applications/{application.application_id}/audit_history",
        json={"pagination": {"page_offset": 1, "page_size": 25}},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_list_application_audit_not_in_org_403(client, enable_factory_create, db_session):
    application = ApplicationFactory.create(with_organization=True)

    user, _different_org, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.VIEW_APPLICATION]
    )

    response = client.post(
        f"/alpha/applications/{application.application_id}/audit_history",
        json={"pagination": {"page_offset": 1, "page_size": 25}},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_list_application_audit_in_org_missing_right_privilege_403(
    client, enable_factory_create, db_session
):
    application = ApplicationFactory.create(with_organization=True)

    user, _different_org, token = create_user_in_org(
        db_session=db_session,
        organization=application.organization,
        privileges=[Privilege.START_APPLICATION],
    )

    response = client.post(
        f"/alpha/applications/{application.application_id}/audit_history",
        json={"pagination": {"page_offset": 1, "page_size": 25}},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_list_application_audit_no_auth_401(client):
    response = client.post(
        f"/alpha/applications/{uuid.uuid4()}/audit_history",
        json={"pagination": {"page_offset": 1, "page_size": 25}},
    )
    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"


def test_list_application_audit_missing_required_422(client, db_session, enable_factory_create):
    user, _, token = create_user_in_app(
        db_session=db_session, privileges=[Privilege.VIEW_APPLICATION]
    )

    response = client.post(
        f"/alpha/applications/{uuid.uuid4()}/audit_history",
        json={},
        headers={"X-SGG-Token": token},
    )
    assert response.status_code == 422
    assert response.json["message"] == "Validation error"
    assert response.json["errors"] == [
        {
            "field": "pagination",
            "message": "Missing data for required field.",
            "type": "required",
            "value": None,
        }
    ]
