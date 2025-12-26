"""Tests for the application submissions list endpoint."""

import uuid

from src.constants.lookup_constants import Privilege
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationSubmissionFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    RoleFactory,
    UserApiKeyFactory,
    UserFactory,
)


def test_application_submissions_list_success_jwt_auth(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test successful retrieval of application submissions with JWT auth"""
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Create some submissions
    submission1 = ApplicationSubmissionFactory.create(application=application)
    submission2 = ApplicationSubmissionFactory.create(application=application)

    db_session.commit()

    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "created_at", "sort_direction": "descending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert len(response.json["data"]) == 2

    # Check pagination info
    assert response.json["pagination_info"]["total_records"] == 2
    assert response.json["pagination_info"]["page_offset"] == 1
    assert response.json["pagination_info"]["page_size"] == 25

    # Check that submission data is present
    submission_ids = {s["application_submission_id"] for s in response.json["data"]}
    assert str(submission1.application_submission_id) in submission_ids
    assert str(submission2.application_submission_id) in submission_ids

    # Check expected fields are present
    for submission in response.json["data"]:
        assert "application_submission_id" in submission
        assert "download_path" in submission
        assert "file_size_bytes" in submission
        assert "legacy_tracking_number" in submission


def test_application_submissions_list_success_api_key_auth(
    client, enable_factory_create, db_session
):
    """Test successful retrieval of application submissions with API key auth"""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user)

    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Create a submission
    submission = ApplicationSubmissionFactory.create(application=application)

    db_session.commit()

    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "created_at", "sort_direction": "descending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-API-Key": api_key.key_id},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["application_submission_id"] == str(
        submission.application_submission_id
    )


def test_application_submissions_list_empty(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test retrieval when there are no submissions"""
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    db_session.commit()

    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "created_at", "sort_direction": "descending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert len(response.json["data"]) == 0
    assert response.json["pagination_info"]["total_records"] == 0


def test_application_submissions_list_unauthorized(client, enable_factory_create, db_session):
    """Test that unauthorized requests are rejected"""
    application = ApplicationFactory.create()

    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "created_at", "sort_direction": "descending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": "invalid.jwt.token"},
    )

    assert response.status_code == 401


def test_application_submissions_list_forbidden(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that users without VIEW_APPLICATION privilege get 403"""
    application = ApplicationFactory.create()

    # User is NOT associated with application - should get 403
    db_session.commit()

    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "created_at", "sort_direction": "descending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_application_submissions_list_application_not_found(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test that 404 is returned for non-existent application"""
    fake_app_id = uuid.uuid4()

    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "created_at", "sort_direction": "descending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{fake_app_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404


def test_application_submissions_list_pagination(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that pagination works correctly"""
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Create 5 submissions
    for _ in range(5):
        ApplicationSubmissionFactory.create(application=application)

    db_session.commit()

    # Request page 1 with page size 2
    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 2,
            "sort_order": [{"order_by": "created_at", "sort_direction": "descending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert len(response.json["data"]) == 2
    assert response.json["pagination_info"]["total_records"] == 5
    assert response.json["pagination_info"]["total_pages"] == 3
    assert response.json["pagination_info"]["page_offset"] == 1
    assert response.json["pagination_info"]["page_size"] == 2

    # Request page 2
    request_data["pagination"]["page_offset"] = 2
    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert len(response.json["data"]) == 2
    assert response.json["pagination_info"]["page_offset"] == 2

    # Request page 3 (last page with 1 item)
    request_data["pagination"]["page_offset"] = 3
    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert len(response.json["data"]) == 1
    assert response.json["pagination_info"]["page_offset"] == 3


def test_application_submissions_list_default_sort(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that default sort is created_at descending"""
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Create submissions
    ApplicationSubmissionFactory.create(application=application)

    db_session.commit()

    # Request without explicit sort order (should use default)
    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["pagination_info"]["sort_order"] == [
        {"order_by": "created_at", "sort_direction": "descending"}
    ]


def test_application_submissions_list_ascending_sort(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that ascending sort works"""
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Create submissions
    ApplicationSubmissionFactory.create(application=application)
    ApplicationSubmissionFactory.create(application=application)

    db_session.commit()

    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "created_at", "sort_direction": "ascending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["pagination_info"]["sort_order"] == [
        {"order_by": "created_at", "sort_direction": "ascending"}
    ]


def test_application_submissions_list_invalid_sort_field(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that invalid sort field returns 422"""
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    db_session.commit()

    request_data = {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "invalid_field", "sort_direction": "descending"}],
        }
    }

    response = client.post(
        f"/alpha/applications/{application.application_id}/submissions",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 422
