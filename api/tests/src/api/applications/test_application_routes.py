import logging
import uuid
from datetime import date, timedelta

import pytest
from sqlalchemy import select

from src.auth.api_jwt_auth import create_jwt_for_user
from src.auth.internal_jwt_auth import create_jwt_for_internal_token
from src.constants.lookup_constants import (
    ApplicationAuditEvent,
    ApplicationFormStatus,
    CompetitionOpenToApplicant,
    Privilege,
)
from src.db.models.competition_models import Application, ApplicationForm, ApplicationStatus
from src.db.models.user_models import ApplicationUser
from src.util import datetime_util
from src.util.datetime_util import get_now_us_eastern_date
from src.validation.validation_constants import ValidationErrorType
from tests.lib.application_test_utils import create_user_in_app
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    OpportunityFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    SamGovEntityFactory,
    UserFactory,
)

# Simple JSON schema used for tests below
SIMPLE_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer", "maximum": 200},
    },
    "required": ["name"],
}

SIMPLE_ATTACHMENT_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "attachment_field": {"type": "string", "format": "uuid"},
    },
}

SIMPLE_ATTACHMENT_RULE_SCHEMA = {"attachment_field": {"gg_validation": {"rule": "attachment"}}}


def test_application_start_success(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test successful creation of an application"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created in the database
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id
    assert application.application_status == ApplicationStatus.IN_PROGRESS
    assert len(application.application_audits) == 2
    assert {a.application_audit_event for a in application.application_audits} == {
        ApplicationAuditEvent.APPLICATION_CREATED,
        ApplicationAuditEvent.USER_ADDED,
    }

    for app_audit in application.application_audits:
        assert app_audit.user_id == user.user_id
        if app_audit.application_audit_event == ApplicationAuditEvent.USER_ADDED:
            assert app_audit.target_user_id == user.user_id


def test_application_start_logging_enhancement(
    client, enable_factory_create, db_session, user, user_auth_token, caplog
):
    """Test that the Start Application endpoint adds application metadata to logs for New Relic dashboards"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create a competition with an opportunity that has an agency_code
    opportunity = OpportunityFactory.create(agency_code="TEST")
    competition = CompetitionFactory.create(
        opening_date=today, closing_date=future_date, opportunity=opportunity
    )

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    # Set log level to capture INFO messages
    caplog.set_level(logging.INFO)

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify that the application metadata was added to the logs
    _ = response.json["data"]["application_id"]

    # Check that the log messages contain the expected metadata
    log_records = [
        record for record in caplog.records if "application" in record.getMessage().lower()
    ]

    # Should find at least one log message with the application metadata
    found_metadata = False
    for record in log_records:
        if (
            hasattr(record, "organization_id")
            or hasattr(record, "competition_id")
            or hasattr(record, "opportunity_id")
            or hasattr(record, "agency_code")
        ):
            found_metadata = True
            break

    assert found_metadata, "Application metadata should be added to logs for New Relic dashboards"


def test_application_start_null_opening_date(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation succeeds when opening_date is null (matches legacy behavior)"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    competition = CompetitionFactory.create(opening_date=None, closing_date=future_date)

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    # Should succeed now (legacy behavior - null opening_date means immediately open)
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created in the database
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id


def test_application_start_before_opening_date(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation fails when current date is before opening_date"""
    today = get_now_us_eastern_date()
    future_opening_date = today + timedelta(days=5)
    future_closing_date = today + timedelta(days=15)

    # Create organization and associate user with required privileges
    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )
    competition = CompetitionFactory.create(
        opening_date=future_opening_date, closing_date=future_closing_date
    )

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization.organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 422
    assert "Cannot start application - competition is not open" in response.json["message"]
    assert response.json["errors"][0]["type"] == ValidationErrorType.COMPETITION_NOT_OPEN

    # Verify no application was created
    applications_count = (
        db_session.execute(select(Application).where(Application.competition_id == competition_id))
        .scalars()
        .all()
    )
    assert len(applications_count) == 0


def test_application_start_after_closing_date(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation fails when current date is after closing_date"""
    today = get_now_us_eastern_date()
    past_opening_date = today - timedelta(days=15)
    past_closing_date = today - timedelta(days=5)
    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )
    competition = CompetitionFactory.create(
        opening_date=past_opening_date, closing_date=past_closing_date, grace_period=0
    )

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization.organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 422
    assert "Cannot start application - competition is not open" in response.json["message"]
    assert response.json["errors"][0]["type"] == ValidationErrorType.COMPETITION_NOT_OPEN

    # Verify no application was created
    applications_count = (
        db_session.execute(select(Application).where(Application.competition_id == competition_id))
        .scalars()
        .all()
    )
    assert len(applications_count) == 0


def test_application_start_with_grace_period(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation succeeds when within grace period"""
    today = get_now_us_eastern_date()
    past_opening_date = today - timedelta(days=15)
    past_closing_date = today - timedelta(days=5)
    grace_period = 7  # 7 days grace period

    competition = CompetitionFactory.create(
        opening_date=past_opening_date, closing_date=past_closing_date, grace_period=grace_period
    )

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created in the database
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id


def test_application_start_after_grace_period(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation fails when after grace period"""
    today = get_now_us_eastern_date()
    past_opening_date = today - timedelta(days=20)
    past_closing_date = today - timedelta(days=10)
    grace_period = 5  # 5 days grace period
    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )
    competition = CompetitionFactory.create(
        opening_date=past_opening_date, closing_date=past_closing_date, grace_period=grace_period
    )

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        "organiation_id": organization.organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 422
    assert "Cannot start application - competition is not open" in response.json["message"]
    assert response.json["errors"][0]["type"] == ValidationErrorType.COMPETITION_NOT_OPEN

    # Verify no application was created
    applications_count = (
        db_session.execute(select(Application).where(Application.competition_id == competition_id))
        .scalars()
        .all()
    )
    assert len(applications_count) == 0


def test_application_start_null_closing_date(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation succeeds when closing_date is null and opening_date is in the past"""
    today = get_now_us_eastern_date()
    past_opening_date = today - timedelta(days=5)

    competition = CompetitionFactory.create(opening_date=past_opening_date, closing_date=None)

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created in the database
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id


def test_application_start_competition_not_found(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test application creation fails when competition doesn't exist"""
    non_existent_competition_id = str(uuid.uuid4())
    request_data = {"competition_id": non_existent_competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 404
    assert "Competition not found" in response.json["message"]

    # Verify no application was created
    applications_count = (
        db_session.execute(
            select(Application).where(Application.competition_id == non_existent_competition_id)
        )
        .scalars()
        .all()
    )
    assert len(applications_count) == 0


def test_application_start_unauthorized(client, enable_factory_create, db_session):
    """Test application creation fails without proper authentication"""

    competition = CompetitionFactory.create()

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    # Use an invalid JWT token
    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": "invalid.jwt.token"}
    )

    assert response.status_code == 401

    # Verify no application was created
    applications_count = (
        db_session.execute(select(Application).where(Application.competition_id == competition_id))
        .scalars()
        .all()
    )
    assert len(applications_count) == 0


def test_application_start_invalid_request(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test application creation fails with invalid request data"""
    application_count_before = len(db_session.execute(select(Application)).scalars().all())

    request_data = {"my_field": {"a": 1, "b": [{"c": "hello"}]}}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 422  # Validation error

    # Verify no application was created
    applications_count = db_session.execute(select(Application)).scalars().all()
    assert len(applications_count) == application_count_before


def test_application_form_update_success_create(
    client,
    enable_factory_create,
    db_session,
):
    """Test successful creation of an application form response"""
    # Create application
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    competition_form = CompetitionFormFactory.create(competition=application.competition)

    application_id = str(application.application_id)
    form_id = str(competition_form.form_id)
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    # Assert
    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application form was created in the database
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.competition_form_id == competition_form.competition_form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == {"name": "John Doe"}

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.FORM_UPDATED
    )
    assert application.application_audits[0].user_id == user.user_id
    assert (
        application.application_audits[0].target_application_form_id
        == application_form.application_form_id
    )


def test_application_form_update_success_update(
    client,
    enable_factory_create,
    db_session,
):
    """Test successful update of an existing application form response"""
    # Create application
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Original Name"},
    )

    request_data = {"application_response": {"name": "Updated Name"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["warnings"] == []

    # Verify application form was updated in the database
    db_session.refresh(existing_form)
    assert existing_form.application_response == {"name": "Updated Name"}

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.FORM_UPDATED
    )
    assert application.application_audits[0].user_id == user.user_id
    assert (
        application.application_audits[0].target_application_form_id
        == existing_form.application_form_id
    )


@pytest.mark.parametrize(
    "application_response,expected_warnings,expected_form_status",
    [
        # Missing required field
        (
            {},
            [
                {
                    "field": "$.name",
                    "message": "'name' is a required property",
                    "type": "required",
                    "value": None,
                }
            ],
            ApplicationFormStatus.IN_PROGRESS,
        ),
        # Validation on age field
        (
            {"name": "bob", "age": 500},
            [
                {
                    "field": "$.age",
                    "message": "500 is greater than the maximum of 200",
                    "type": "maximum",
                    "value": None,
                }
            ],
            ApplicationFormStatus.IN_PROGRESS,
        ),
        # Extra fields are fine with our setup
        ({"name": "bob", "age": 50, "something_else": ""}, [], ApplicationFormStatus.COMPLETE),
    ],
)
def test_application_form_update_with_validation_warnings(
    client,
    enable_factory_create,
    db_session,
    application_response,
    expected_warnings,
    expected_form_status,
):
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Original Name"},
    )

    request_data = {"application_response": application_response}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_status"] == expected_form_status
    assert response.json["warnings"] == expected_warnings

    # Verify application form was updated in the database
    db_session.refresh(existing_application_form)
    assert existing_application_form.application_response == application_response

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.FORM_UPDATED
    )
    assert application.application_audits[0].user_id == user.user_id
    assert (
        application.application_audits[0].target_application_form_id
        == existing_application_form.application_form_id
    )


def test_application_form_update_with_rule_validation_issues(
    client, enable_factory_create, db_session
):
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create(
        form_json_schema=SIMPLE_ATTACHMENT_JSON_SCHEMA,
        form_rule_schema=SIMPLE_ATTACHMENT_RULE_SCHEMA,
    )

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={},
    )

    application_response = {"attachment_field": "90b413f3-b0f3-4aed-9f30-c109991db0fc"}
    request_data = {"application_response": application_response}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_status"] == ApplicationFormStatus.IN_PROGRESS
    assert response.json["warnings"] == [
        {
            "field": "$.attachment_field",
            "message": "Field references application_attachment_id not on the application",
            "type": "unknown_application_attachment",
            "value": "90b413f3-b0f3-4aed-9f30-c109991db0fc",
        }
    ]

    # Verify application form was updated in the database
    db_session.refresh(existing_application_form)
    assert existing_application_form.application_response == application_response

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.FORM_UPDATED
    )
    assert application.application_audits[0].user_id == user.user_id
    assert (
        application.application_audits[0].target_application_form_id
        == existing_application_form.application_form_id
    )


def test_application_form_update_with_invalid_schema_500(
    client,
    enable_factory_create,
    db_session,
):
    """In this test we intentionally create a bad JSON schema"""
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create(form_json_schema={"properties": ["bad"]})

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Original Name"},
    )

    request_data = {"application_response": {"name": "Changed Name"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal Server Error"
    # Verify the response was not updated
    db_session.refresh(existing_application_form)
    assert existing_application_form.application_response == {"name": "Original Name"}

    # Verify no audit event added
    assert len(application.application_audits) == 0


def test_application_form_update_application_not_found(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test application form update fails when application doesn't exist"""
    # Create form
    competition_form = CompetitionFormFactory.create()

    non_existent_application_id = str(uuid.uuid4())
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{non_existent_application_id}/forms/{competition_form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert
    assert response.status_code == 404
    assert (
        f"Application with ID {non_existent_application_id} not found" in response.json["message"]
    )

    # Verify no application form was created
    application_forms = (
        db_session.execute(
            select(ApplicationForm).where(
                ApplicationForm.competition_form_id == competition_form.form_id
            )
        )
        .scalars()
        .all()
    )
    assert len(application_forms) == 0


def test_application_form_update_form_not_found(
    client,
    enable_factory_create,
    db_session,
):
    """Test application form update fails when form doesn't exist"""
    # Associate user with application
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    application_id = str(application.application_id)
    non_existent_form_id = str(uuid.uuid4())
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{non_existent_form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    # Assert
    assert response.status_code == 404
    assert "Form with ID" in response.json["message"]
    assert "not found or not attached" in response.json["message"]

    # Verify no application form was created
    application_forms = (
        db_session.execute(
            select(ApplicationForm).where(ApplicationForm.application_id == application_id)
        )
        .scalars()
        .all()
    )
    assert len(application_forms) == 0


def test_application_form_update_unauthorized(client, enable_factory_create, db_session):
    """Test application form update fails without proper authentication"""
    request_data = {"application_response": {"name": "John Doe"}}

    application = ApplicationFactory.create()

    # Act
    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{uuid.uuid4()}",
        json=request_data,
        headers={"X-SGG-Token": "invalid-token"},
    )

    # Assert
    assert response.status_code == 401

    # Verify no application form was created
    application_forms = (
        db_session.execute(
            select(ApplicationForm).where(
                ApplicationForm.application_id == application.application_id
            )
        )
        .scalars()
        .all()
    )
    assert len(application_forms) == 0


def test_application_form_update_invalid_request(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test application form update fails with invalid request data"""
    request_data = {}  # Missing required application_response

    application = ApplicationFactory.create()

    # Act
    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{uuid.uuid4()}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert
    assert response.status_code == 422  # Validation error

    # Verify no application form was created
    application_forms = (
        db_session.execute(
            select(ApplicationForm).where(
                ApplicationForm.application_id == application.application_id
            )
        )
        .scalars()
        .all()
    )
    assert len(application_forms) == 0


def test_application_form_update_complex_json(
    client,
    enable_factory_create,
    db_session,
):
    """Test application form update with complex JSON data"""
    # Create application
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    competition_form = CompetitionFormFactory.create(competition=application.competition)

    application_form = ApplicationFormFactory.create(
        application=application, competition_form=competition_form
    )

    complex_json = {
        "personal_info": {
            "name": "John Doe",
            "age": 30,
            "address": {"street": "123 Main St", "city": "Anytown", "state": "CA", "zip": "12345"},
        },
        "education": [
            {"degree": "Bachelor's", "institution": "University A", "year": 2010},
            {"degree": "Master's", "institution": "University B", "year": 2012},
        ],
        "skills": ["Python", "JavaScript", "SQL"],
        "employed": True,
        "salary": 75000.50,
    }
    request_data = {"application_response": complex_json}

    # Act
    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{competition_form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    # Assert
    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application form was created with complex JSON
    db_session.expunge_all()
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_form_id == application_form.application_form_id
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == complex_json


def test_application_form_update_with_is_included_in_submission_true(
    client,
    enable_factory_create,
    db_session,
):
    """Test application form update with is_included_in_submission set to true"""
    # Create application
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    competition_form = CompetitionFormFactory.create(competition=application.competition)

    application_id = str(application.application_id)
    form_id = str(competition_form.form_id)
    request_data = {
        "application_response": {"name": "John Doe"},
        "is_included_in_submission": True,
    }

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    # Assert
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["is_included_in_submission"] is True

    # Verify application form was created in the database with correct value
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.competition_form_id == competition_form.competition_form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == {"name": "John Doe"}
    assert application_form.is_included_in_submission is True


def test_application_form_update_with_is_included_in_submission_false(
    client,
    enable_factory_create,
    db_session,
):
    """Test application form update with is_included_in_submission set to false"""
    # Create application
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )

    competition_form = CompetitionFormFactory.create(competition=application.competition)
    application_id = str(application.application_id)
    form_id = str(competition_form.form_id)
    request_data = {
        "application_response": {"name": "John Doe"},
        "is_included_in_submission": False,
    }

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    # Assert
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["is_included_in_submission"] is False

    # Verify application form was created in the database with correct value
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.competition_form_id == competition_form.competition_form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == {"name": "John Doe"}
    assert application_form.is_included_in_submission is False


def test_application_form_update_without_is_included_in_submission(
    client,
    enable_factory_create,
    db_session,
):
    """Test application form update without is_included_in_submission field defaults to None"""
    # Create application
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    competition_form = CompetitionFormFactory.create(competition=application.competition)

    application_id = str(application.application_id)
    form_id = str(competition_form.form_id)
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    # Assert
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["is_included_in_submission"] is None

    # Verify application form was created in the database with None value
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.competition_form_id == competition_form.competition_form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == {"name": "John Doe"}
    assert application_form.is_included_in_submission is None


def test_application_form_update_existing_form_preserves_is_included_in_submission(
    client,
    enable_factory_create,
    db_session,
):
    """Test updating existing application form preserves is_included_in_submission when not provided"""
    # Create application
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Original Name"},
        is_included_in_submission=True,
    )

    request_data = {"application_response": {"name": "Updated Name"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["warnings"] == []
    assert response.json["data"]["is_included_in_submission"] is True

    # Verify application form was updated in the database but preserved the flag
    db_session.refresh(existing_form)
    assert existing_form.application_response == {"name": "Updated Name"}
    assert existing_form.is_included_in_submission is True


def test_application_form_update_existing_form_updates_is_included_in_submission(
    client,
    enable_factory_create,
    db_session,
):
    """Test updating existing application form updates is_included_in_submission when provided"""
    # Create application
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Original Name"},
        is_included_in_submission=True,
    )

    request_data = {
        "application_response": {"name": "Updated Name"},
        "is_included_in_submission": False,
    }

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["warnings"] == []
    assert response.json["data"]["is_included_in_submission"] is False

    # Verify application form was updated in the database
    db_session.refresh(existing_form)
    assert existing_form.application_response == {"name": "Updated Name"}
    assert existing_form.is_included_in_submission is False


def test_application_form_get_success(
    client, enable_factory_create, db_session, user, user_auth_token
):
    application_form = ApplicationFormFactory.create(
        application_response={"name": "John Doe"},
    )

    CompetitionFormFactory.create(
        competition=application_form.application.competition,
        form=application_form.form,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(
            user=user, application=application_form.application
        ),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)
    assert response.json["data"]["application_id"] == str(application_form.application_id)
    assert response.json["data"]["form_id"] == str(application_form.form_id)
    assert response.json["data"]["application_response"] == {"name": "John Doe"}
    # Verify application_attachments field exists (empty list in this case)
    assert response.json["data"]["application_attachments"] == []
    assert (
        response.json["data"]["application_name"] == application_form.application.application_name
    )
    # Verify application_status field is included and has the expected value
    assert response.json["data"]["application_status"] == ApplicationStatus.IN_PROGRESS


def test_application_form_get_application_not_found(
    client, enable_factory_create, db_session, user_auth_token
):
    non_existent_application_id = str(uuid.uuid4())
    non_existent_app_form_id = str(uuid.uuid4())

    response = client.get(
        f"/alpha/applications/{non_existent_application_id}/application_form/{non_existent_app_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert (
        f"Application with ID {non_existent_application_id} not found" in response.json["message"]
    )


def test_application_form_get_form_not_found(
    client,
    enable_factory_create,
    db_session,
):
    # Associate user with application
    _, application, token = create_user_in_app(db_session, privileges=[Privilege.VIEW_APPLICATION])

    non_existent_app_form_id = str(uuid.uuid4())

    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{non_existent_app_form_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    assert (
        f"Application form with ID {non_existent_app_form_id} not found" in response.json["message"]
    )


def test_application_form_get_unauthorized(client, enable_factory_create, db_session):

    application = ApplicationFactory.create()

    application_form = ApplicationFormFactory.create(
        application=application,
        application_response={"name": "John Doe"},
    )

    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": "invalid-token"},
    )

    assert response.status_code == 401


def test_application_form_get_with_attachments(
    client, enable_factory_create, db_session, user, user_auth_token
):
    # Create an application form
    application_form = ApplicationFormFactory.create(
        application_response={"name": "John Doe"},
    )

    # Create attachments for the application
    attachment1 = ApplicationAttachmentFactory.create(
        application=application_form.application, file_name="my_file_a.txt"
    )
    attachment2 = ApplicationAttachmentFactory.create(
        application=application_form.application, file_name="my_file_b.pdf"
    )
    # Add a deleted attachment that won't get picked up
    ApplicationAttachmentFactory.create(application=application_form.application, is_deleted=True)

    CompetitionFormFactory.create(
        competition=application_form.application.competition,
        form=application_form.form,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(
            user=user, application=application_form.application
        ),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify basic application form data
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)
    assert response.json["data"]["application_id"] == str(application_form.application_id)
    assert response.json["data"]["form_id"] == str(application_form.form_id)
    assert response.json["data"]["application_response"] == {"name": "John Doe"}

    # Verify application attachments are included
    resp_application_attachments = response.json["data"]["application_attachments"]
    assert len(resp_application_attachments) == 2

    # Sort by file name which we set above so attachment1 is always first
    resp_application_attachments.sort(key=lambda a: a["file_name"])

    assert resp_application_attachments[0]["application_attachment_id"] == str(
        attachment1.application_attachment_id
    )
    assert resp_application_attachments[0]["file_name"] == attachment1.file_name
    assert resp_application_attachments[0]["mime_type"] == attachment1.mime_type
    assert resp_application_attachments[0]["file_size_bytes"] == attachment1.file_size_bytes
    assert resp_application_attachments[0]["created_at"] == attachment1.created_at.isoformat()
    assert resp_application_attachments[0]["updated_at"] == attachment1.updated_at.isoformat()

    assert resp_application_attachments[1]["application_attachment_id"] == str(
        attachment2.application_attachment_id
    )
    assert resp_application_attachments[1]["file_name"] == attachment2.file_name
    assert resp_application_attachments[1]["mime_type"] == attachment2.mime_type
    assert resp_application_attachments[1]["file_size_bytes"] == attachment2.file_size_bytes
    assert resp_application_attachments[1]["created_at"] == attachment2.created_at.isoformat()
    assert resp_application_attachments[1]["updated_at"] == attachment2.updated_at.isoformat()


def test_application_get_success(client, enable_factory_create, db_session, user, user_auth_token):
    application = ApplicationFactory.create(with_forms=True)
    application_forms = sorted(application.application_forms, key=lambda x: x.application_form_id)

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_id"] == str(application.application_id)
    assert response.json["data"]["competition"]["competition_id"] == str(application.competition_id)
    response_application_forms = sorted(
        response.json["data"]["application_forms"], key=lambda x: x["application_form_id"]
    )
    assert len(response_application_forms) == len(application_forms)
    for application_form, application_form_response in zip(
        application_forms, response_application_forms, strict=True
    ):
        assert application_form_response["application_form_id"] == str(
            application_form.application_form_id
        )
        assert application_form_response["application_id"] == str(application.application_id)
        assert application_form_response["form_id"] == str(application_form.form_id)
        assert (
            application_form_response["application_response"]
            == application_form.application_response
        )
        assert (
            application_form_response["application_form_status"]
            == ApplicationFormStatus.IN_PROGRESS
        )
        assert application_form_response["created_at"] == application_form.created_at.isoformat()
        assert application_form_response["updated_at"] == application_form.updated_at.isoformat()
        assert application_form_response["is_required"] is True
        assert application_form_response["is_included_in_submission"] is None
        assert application_form_response["application_attachments"] == []
        assert application_form_response["application_name"] == application.application_name
        # Check the form
        assert application_form_response["form"]["form_name"] == application_form.form.form_name
        assert (
            application_form_response["form"]["form_json_schema"]
            == application_form.form.form_json_schema
        )
        assert (
            application_form_response["form"]["form_ui_schema"]
            == application_form.form.form_ui_schema
        )
        assert (
            application_form_response["form"]["form_rule_schema"]
            == application_form.form.form_rule_schema
        )


def test_application_get_with_attachments(
    client,
    enable_factory_create,
    db_session,
):
    # Associate user with application
    _, application, token = create_user_in_app(db_session, privileges=[Privilege.VIEW_APPLICATION])
    attachment1 = ApplicationAttachmentFactory.create(
        application=application, file_name="my_file_a.txt"
    )
    attachment2 = ApplicationAttachmentFactory.create(
        application=application, file_name="my_file_b.pdf"
    )
    # Add a deleted attachment that won't get picked up
    ApplicationAttachmentFactory.create(application=application, is_deleted=True)

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    resp_application_attachments = response.json["data"]["application_attachments"]
    assert len(resp_application_attachments) == 2

    # Sort by file name which we set above so attachment1 is always first
    resp_application_attachments.sort(key=lambda a: a["file_name"])

    assert resp_application_attachments[0]["application_attachment_id"] == str(
        attachment1.application_attachment_id
    )
    assert resp_application_attachments[0]["file_name"] == attachment1.file_name
    assert resp_application_attachments[0]["mime_type"] == attachment1.mime_type
    assert resp_application_attachments[0]["file_size_bytes"] == attachment1.file_size_bytes
    assert resp_application_attachments[0]["created_at"] == attachment1.created_at.isoformat()
    assert resp_application_attachments[0]["updated_at"] == attachment1.updated_at.isoformat()

    assert resp_application_attachments[1]["application_attachment_id"] == str(
        attachment2.application_attachment_id
    )
    assert resp_application_attachments[1]["file_name"] == attachment2.file_name
    assert resp_application_attachments[1]["mime_type"] == attachment2.mime_type
    assert resp_application_attachments[1]["file_size_bytes"] == attachment2.file_size_bytes
    assert resp_application_attachments[1]["created_at"] == attachment2.created_at.isoformat()
    assert resp_application_attachments[1]["updated_at"] == attachment2.updated_at.isoformat()


def test_application_get_success_with_validation_issues(
    client, enable_factory_create, db_session, user, user_auth_token
):

    # Create a competition with two forms
    form_a = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    form_b = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition = CompetitionFactory.create(competition_forms=[])
    competition_form_a = CompetitionFormFactory.create(competition=competition, form=form_a)
    competition_form_b = CompetitionFormFactory.create(competition=competition, form=form_b)

    # Create an application with two app forms, one partially filled out, one not started
    application = ApplicationFactory.create(competition=competition)
    application_form_a = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form_a,
        application_response={"age": 500},
    )
    application_form_b = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form_b,
        application_response={"age": 20},
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    assert len(response.json["warnings"]) == 2
    for warning in response.json["warnings"]:
        assert warning["field"] == "application_form_id"
        assert warning["message"] == "The application form has outstanding errors."
        assert warning["type"] == "application_form_validation"
        assert warning["value"] in {
            str(application_form_a.application_form_id),
            str(application_form_b.application_form_id),
        }

    form_a_warnings = response.json["data"]["form_validation_warnings"][
        str(application_form_a.application_form_id)
    ]
    assert form_a_warnings == [
        {
            "field": "$.name",
            "message": "'name' is a required property",
            "type": "required",
            "value": None,
        },
        {
            "field": "$.age",
            "message": "500 is greater than the maximum of 200",
            "type": "maximum",
            "value": None,
        },
    ]

    form_b_warnings = response.json["data"]["form_validation_warnings"][
        str(application_form_b.application_form_id)
    ]
    assert form_b_warnings == [
        {
            "field": "$.name",
            "message": "'name' is a required property",
            "type": "required",
            "value": None,
        }
    ]

    # Validate the application form statuses are as expected
    application_form_statuses = {
        app_form["application_form_id"]: app_form["application_form_status"]
        for app_form in response.json["data"]["application_forms"]
    }
    assert (
        application_form_statuses[str(application_form_a.application_form_id)]
        == ApplicationFormStatus.IN_PROGRESS
    )
    assert (
        application_form_statuses[str(application_form_b.application_form_id)]
        == ApplicationFormStatus.IN_PROGRESS
    )


def test_application_get_success_with_rule_validation_issue(
    client, enable_factory_create, db_session, user, user_auth_token
):
    # Create a competition with two forms
    form_a = FormFactory.create(
        form_json_schema=SIMPLE_ATTACHMENT_JSON_SCHEMA,
        form_rule_schema=SIMPLE_ATTACHMENT_RULE_SCHEMA,
    )
    form_b = FormFactory.create(
        form_json_schema=SIMPLE_ATTACHMENT_JSON_SCHEMA,
        form_rule_schema=SIMPLE_ATTACHMENT_RULE_SCHEMA,
    )
    competition = CompetitionFactory.create(competition_forms=[])
    competition_form_a = CompetitionFormFactory.create(competition=competition, form=form_a)
    competition_form_b = CompetitionFormFactory.create(competition=competition, form=form_b)

    # Create an application with two app forms, one partially filled out, one not started
    application = ApplicationFactory.create(competition=competition)

    # This attachment is deleted, so validation won't see it
    deleted_attachment = ApplicationAttachmentFactory.create(
        application=application, is_deleted=True
    )

    application_form_a = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form_a,
        application_response={
            "attachment_field": str(deleted_attachment.application_attachment_id)
        },
    )
    application_form_b = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form_b,
        application_response={"attachment_field": "43fc2b03-6025-41be-81ee-d8b339189530"},
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    assert len(response.json["warnings"]) == 2
    for warning in response.json["warnings"]:
        assert warning["field"] == "application_form_id"
        assert warning["message"] == "The application form has outstanding errors."
        assert warning["type"] == "application_form_validation"
        assert warning["value"] in {
            str(application_form_a.application_form_id),
            str(application_form_b.application_form_id),
        }

    form_a_warnings = response.json["data"]["form_validation_warnings"][
        str(application_form_a.application_form_id)
    ]
    assert form_a_warnings == [
        {
            "field": "$.attachment_field",
            "message": "Field references application_attachment_id not on the application",
            "type": "unknown_application_attachment",
            "value": str(deleted_attachment.application_attachment_id),
        }
    ]

    form_b_warnings = response.json["data"]["form_validation_warnings"][
        str(application_form_b.application_form_id)
    ]
    assert form_b_warnings == [
        {
            "field": "$.attachment_field",
            "message": "Field references application_attachment_id not on the application",
            "type": "unknown_application_attachment",
            "value": "43fc2b03-6025-41be-81ee-d8b339189530",
        }
    ]

    # Validate the application form statuses are as expected
    application_form_statuses = {
        app_form["application_form_id"]: app_form["application_form_status"]
        for app_form in response.json["data"]["application_forms"]
    }
    assert (
        application_form_statuses[str(application_form_a.application_form_id)]
        == ApplicationFormStatus.IN_PROGRESS
    )
    assert (
        application_form_statuses[str(application_form_b.application_form_id)]
        == ApplicationFormStatus.IN_PROGRESS
    )


def test_application_get_application_not_found(
    client, enable_factory_create, db_session, user_auth_token
):
    non_existent_application_id = str(uuid.uuid4())

    response = client.get(
        f"/alpha/applications/{non_existent_application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert (
        f"Application with ID {non_existent_application_id} not found" in response.json["message"]
    )


def test_application_get_unauthorized(client, enable_factory_create, db_session):
    application = ApplicationFactory.create()

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": "invalid-token"},
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    "application_response,expected_warnings,expected_form_status",
    [
        # Valid data - no warnings
        ({"name": "John Doe", "age": 30}, [], ApplicationFormStatus.COMPLETE),
        # Missing required field
        (
            {},
            [
                {
                    "field": "$.name",
                    "message": "'name' is a required property",
                    "type": "required",
                    "value": None,
                }
            ],
            ApplicationFormStatus.IN_PROGRESS,
        ),
        # Validation on age field
        (
            {"name": "bob", "age": 500},
            [
                {
                    "field": "$.age",
                    "message": "500 is greater than the maximum of 200",
                    "type": "maximum",
                    "value": None,
                }
            ],
            ApplicationFormStatus.IN_PROGRESS,
        ),
    ],
)
def test_application_form_get_with_validation_warnings(
    client,
    enable_factory_create,
    db_session,
    user,
    user_auth_token,
    application_response,
    expected_warnings,
    expected_form_status,
):
    """Test that GET application form endpoint includes schema validation warnings"""
    # Create a form with our test schema
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    # Create application with the form
    application = ApplicationFactory.create()

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create application form with the test response data
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response=application_response,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Make the GET request
    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Verify response
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)
    assert response.json["data"]["application_response"] == application_response
    assert response.json["data"]["application_form_status"] == expected_form_status
    assert response.json["warnings"] == expected_warnings


def test_application_form_get_with_rule_validation_issue(
    client,
    enable_factory_create,
    db_session,
    user,
    user_auth_token,
):
    # Create a form with our test schema
    form = FormFactory.create(
        form_json_schema=SIMPLE_ATTACHMENT_JSON_SCHEMA,
        form_rule_schema=SIMPLE_ATTACHMENT_RULE_SCHEMA,
    )

    # Create application with the form
    application = ApplicationFactory.create()

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create application form with the test response data
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"attachment_field": "0296eed1-b358-4920-9185-08709ab12e60"},
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Make the GET request
    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Verify response
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)
    assert response.json["warnings"] == [
        {
            "field": "$.attachment_field",
            "message": "Field references application_attachment_id not on the application",
            "type": "unknown_application_attachment",
            "value": "0296eed1-b358-4920-9185-08709ab12e60",
        }
    ]
    assert response.json["data"]["application_form_status"] == ApplicationFormStatus.IN_PROGRESS


def test_application_form_get_with_invalid_schema(
    client,
    enable_factory_create,
    db_session,
    user,
    user_auth_token,
):
    """Test behavior when form has an invalid JSON schema"""
    # Create a form with intentionally invalid schema
    form = FormFactory.create(form_json_schema={"properties": ["bad"]})

    # Create application with the form
    application = ApplicationFactory.create()

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create application form with some data
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Test Name"},
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Make the GET request
    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Should error
    assert response.status_code == 500
    assert "message" in response.json


def test_application_submit_success(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test successful submission of an application"""
    # Create a competition with a future closing date
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)
    competition = CompetitionFactory.create(closing_date=future_date, competition_forms=[])

    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    competition_form = CompetitionFormFactory.create(
        competition=competition,
        form=form,
    )

    # Create an application in the IN_PROGRESS state
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )
    ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Test Name"},
    )

    application_id = str(application.application_id)

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    response = client.post(
        f"/alpha/applications/{application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert response
    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application status was updated
    db_session.refresh(application)
    assert application.application_status == ApplicationStatus.SUBMITTED

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.APPLICATION_SUBMITTED
    )
    assert application.application_audits[0].user_id == user.user_id


def test_application_submit_logging_enhancement(
    client, enable_factory_create, db_session, user, user_auth_token, caplog
):
    """Test that the Submit Application endpoint adds application metadata to logs for New Relic dashboards"""
    # Create a competition with a future closing date and opportunity with agency_code
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    opportunity = OpportunityFactory.create(agency_code="TEST")
    competition = CompetitionFactory.create(
        closing_date=future_date, competition_forms=[], opportunity=opportunity
    )

    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    competition_form = CompetitionFormFactory.create(
        competition=competition,
        form=form,
    )

    # Create an application in the IN_PROGRESS state
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )
    ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Test Name"},
    )

    application_id = str(application.application_id)

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    # Set log level to capture INFO messages
    caplog.set_level(logging.INFO)

    response = client.post(
        f"/alpha/applications/{application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert response
    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application status was updated
    db_session.refresh(application)
    assert application.application_status == ApplicationStatus.SUBMITTED

    # Check that the log messages contain the expected metadata
    log_records = [
        record for record in caplog.records if "application" in record.getMessage().lower()
    ]

    # Should find at least one log message with the application metadata
    found_metadata = False
    for record in log_records:
        if (
            hasattr(record, "organization_id")
            or hasattr(record, "competition_id")
            or hasattr(record, "opportunity_id")
            or hasattr(record, "agency_code")
        ):
            found_metadata = True
            break

    assert found_metadata, "Application metadata should be added to logs for New Relic dashboards"

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.APPLICATION_SUBMITTED
    )
    assert application.application_audits[0].user_id == user.user_id


def test_application_submit_validation_issues(
    client, enable_factory_create, db_session, user, user_auth_token
):
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)
    competition = CompetitionFactory.create(closing_date=future_date, competition_forms=[])

    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    competition_form = CompetitionFormFactory.create(
        competition=competition,
        form=form,
    )

    # Create an application in the IN_PROGRESS state
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )
    application_form = ApplicationFormFactory.create(
        application=application, competition_form=competition_form, application_response={"name": 5}
    )

    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    response = client.post(
        f"/alpha/applications/{application.application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert response
    assert response.status_code == 422
    assert response.json["message"] == "The application has issues in its form responses."

    assert response.json["data"] == {
        "form_validation_errors": {
            str(application_form.application_form_id): [
                {
                    "field": "$.name",
                    "message": "5 is not of type 'string'",
                    "type": "type",
                    "value": None,
                }
            ]
        }
    }

    assert response.json["errors"] == [
        {
            "field": "application_form_id",
            "message": "The application form has outstanding errors.",
            "type": "application_form_validation",
            "value": str(application_form.application_form_id),
        }
    ]

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.APPLICATION_SUBMIT_REJECTED
    )


def test_application_submit_rule_validation_issue(
    client,
    enable_factory_create,
    db_session,
    user,
    user_auth_token,
):
    # Create a form with our test schema
    form = FormFactory.create(
        form_json_schema=SIMPLE_ATTACHMENT_JSON_SCHEMA,
        form_rule_schema=SIMPLE_ATTACHMENT_RULE_SCHEMA,
    )

    # Create application with the form
    competition = CompetitionFactory.create(competition_forms=[])
    application = ApplicationFactory.create(competition=competition)

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create application form with the test response data
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"attachment_field": "30092ec9-9553-4eb2-a6be-dac919df6867"},
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    response = client.post(
        f"/alpha/applications/{application.application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert response
    assert response.status_code == 422
    assert response.json["message"] == "The application has issues in its form responses."

    assert response.json["data"] == {
        "form_validation_errors": {
            str(application_form.application_form_id): [
                {
                    "field": "$.attachment_field",
                    "message": "Field references application_attachment_id not on the application",
                    "type": "unknown_application_attachment",
                    "value": "30092ec9-9553-4eb2-a6be-dac919df6867",
                }
            ]
        }
    }

    assert response.json["errors"] == [
        {
            "field": "application_form_id",
            "message": "The application form has outstanding errors.",
            "type": "application_form_validation",
            "value": str(application_form.application_form_id),
        }
    ]

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.APPLICATION_SUBMIT_REJECTED
    )
    assert application.application_audits[0].user_id == user.user_id


def test_application_submit_invalid_required_form(
    client, enable_factory_create, db_session, user, user_auth_token
):
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)
    competition = CompetitionFactory.create(closing_date=future_date, competition_forms=[])

    form = FormFactory.create(form_name="ExampleForm-ABC", form_json_schema=SIMPLE_JSON_SCHEMA)

    competition_form = CompetitionFormFactory.create(
        competition=competition, form=form, is_required=True
    )

    # Create an application in the IN_PROGRESS state
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )

    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    # Setup an application form without any answers yet
    application_form = ApplicationFormFactory.create(
        application=application, competition_form=competition_form, application_response={}
    )

    response = client.post(
        f"/alpha/applications/{application.application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert response
    assert response.status_code == 422
    assert response.json["message"] == "The application has issues in its form responses."
    # With the new validation logic, empty required forms generate APPLICATION_FORM_VALIDATION errors
    # instead of MISSING_REQUIRED_FORM errors
    assert response.json["errors"] == [
        {
            "field": "application_form_id",
            "message": "The application form has outstanding errors.",
            "type": "application_form_validation",
            "value": str(application_form.application_form_id),
        }
    ]

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.APPLICATION_SUBMIT_REJECTED
    )


@pytest.mark.parametrize(
    "initial_status", [ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED]
)
def test_application_form_update_forbidden_not_in_progress(
    client, enable_factory_create, db_session, initial_status
):
    """Test form update fails if application is not in IN_PROGRESS status"""
    # Create an application with a status other than IN_PROGRESS
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION], status=initial_status
    )

    form = FormFactory.create()
    CompetitionFormFactory.create(competition=application.competition, form=form)

    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    # Assert forbidden response
    assert response.status_code == 403
    assert (
        f"Cannot modify application. It is currently in status: {initial_status}"
        in response.json["message"]
    )
    assert len(response.json["errors"]) == 1
    assert response.json["errors"][0]["type"] == ValidationErrorType.NOT_IN_PROGRESS
    assert (
        response.json["errors"][0]["message"]
        == "Cannot modify application, not currently in progress"
    )

    # No audit events as submission issue isn't added for a 403
    assert len(application.application_audits) == 0


@pytest.mark.parametrize(
    "initial_status", [ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED]
)
def test_application_submit_forbidden_not_in_progress(
    client, enable_factory_create, db_session, initial_status
):
    """Test submission fails if application is not in IN_PROGRESS status"""
    # Create an application with a status other than IN_PROGRESS
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.SUBMIT_APPLICATION], status=initial_status
    )
    application_id = str(application.application_id)

    response = client.post(
        f"/alpha/applications/{application_id}/submit",
        headers={"X-SGG-Token": token},
    )

    # Assert forbidden response
    assert response.status_code == 403
    assert (
        f"Cannot submit application. It is currently in status: {initial_status}"
        in response.json["message"]
    )
    assert len(response.json["errors"]) == 1
    assert response.json["errors"][0]["type"] == ValidationErrorType.NOT_IN_PROGRESS
    assert (
        response.json["errors"][0]["message"]
        == "Cannot submit application, not currently in progress"
    )

    # Verify application status remains unchanged
    db_session.refresh(application)
    assert application.application_status == initial_status

    # No audit events as submission issue isn't added for a 403
    assert len(application.application_audits) == 0


def test_application_start_associates_user(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that application creation associates the user from the token session with the application and marks them as owner"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created in the database
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id

    # Verify user is associated with the application and marked as owner
    application_user = db_session.execute(
        select(ApplicationUser).where(
            ApplicationUser.application_id == application_id,
            ApplicationUser.user_id == user.user_id,
        )
    ).scalar_one_or_none()

    assert application_user is not None
    assert application_user.user_id == user.user_id
    assert application_user.application_id == application.application_id


def test_application_start_with_custom_name(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation succeeds with custom application name"""
    today = get_now_us_eastern_date()
    past_opening_date = today - timedelta(days=5)

    competition = CompetitionFactory.create(opening_date=past_opening_date, closing_date=None)

    custom_name = "My Test Application"
    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id, "application_name": custom_name}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created with custom name
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id
    assert application.application_name == custom_name


def test_application_start_with_default_name(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation uses opportunity number as default application name"""
    today = get_now_us_eastern_date()
    past_opening_date = today - timedelta(days=5)

    # Create opportunity with a specific opportunity_number
    opportunity = OpportunityFactory.create(opportunity_number="TEST-OPP-123")
    competition = CompetitionFactory.create(
        opening_date=past_opening_date, closing_date=None, opportunity=opportunity
    )

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}  # No application_name provided

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created with opportunity number as name
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id
    assert application.application_name == "TEST-OPP-123"


def test_application_get_forbidden_if_not_associated(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test application get fails when user is not associated with the application"""
    # Create a user for the auth token and a separate user for the application
    application = ApplicationFactory.create()

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_application_form_get_forbidden_if_not_associated(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test application form get fails when user is not associated with the application"""
    application_form = ApplicationFormFactory.create(
        application_response={"name": "John Doe"},
    )

    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_application_form_update_forbidden_if_not_associated(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test application form update fails when user is not associated with the application"""
    application = ApplicationFactory.create()
    form = FormFactory.create()
    CompetitionFormFactory.create(competition=application.competition, form=form)

    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_application_submit_forbidden_if_not_associated(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test application submit fails when user is not associated with the application"""
    application = ApplicationFactory.create(application_status=ApplicationStatus.IN_PROGRESS)

    response = client.post(
        f"/alpha/applications/{application.application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_application_get_success_when_associated(
    client,
    enable_factory_create,
    db_session,
):
    """Test application get succeeds when user is associated with the application"""
    _, application, token = create_user_in_app(db_session, privileges=[Privilege.VIEW_APPLICATION])

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_id"] == str(application.application_id)
    assert response.json["data"]["competition"]["competition_id"] == str(application.competition_id)


def test_application_form_get_success_when_associated(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application form get succeeds when user is associated with the application"""
    application_form = ApplicationFormFactory.create(
        application_response={"name": "John Doe"},
    )
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(
            user=user, application=application_form.application
        ),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)


def test_application_form_update_success_when_associated(
    client,
    enable_factory_create,
    db_session,
):
    """Test application form update succeeds when user is associated with the application"""
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )

    competition_form = CompetitionFormFactory.create(competition=application.competition)
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{competition_form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application form was created
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.competition_form_id == competition_form.competition_form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == {"name": "John Doe"}

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.FORM_UPDATED
    )
    assert application.application_audits[0].user_id == user.user_id
    assert (
        application.application_audits[0].target_application_form_id
        == application_form.application_form_id
    )


def test_application_submit_success_when_associated(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application submit succeeds when user is associated with the application"""

    # Create a competition with a future closing date
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)
    competition = CompetitionFactory.create(closing_date=future_date, competition_forms=[])

    # Create a form and make it required for the competition
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(
        competition=competition, form=form, is_required=True
    )

    # Create an application in the IN_PROGRESS state
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, competition=competition
    )

    # Create an application form with valid data to ensure validation passes
    ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Valid Name"},
    )

    # Create ApplicationUser association
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )
    response = client.post(
        f"/alpha/applications/{application.application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application status was updated
    db_session.refresh(application)
    assert application.application_status == ApplicationStatus.SUBMITTED


def test_application_get_includes_application_name_and_users(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that application GET response includes the new fields: application_status, application_name, and users"""
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS, application_name="Test Application Name"
    )
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Check that the competition object is included
    assert "competition" in response.json["data"]
    assert response.json["data"]["competition"]["competition_id"] == str(application.competition_id)

    # Check that the new fields are included in the response
    assert (
        response.json["data"]["application_status"] == ApplicationStatus.IN_PROGRESS.value
    )  # Using .value to get the string
    assert response.json["data"]["application_name"] == "Test Application Name"

    # Check that users are included
    assert "users" in response.json["data"]
    assert len(response.json["data"]["users"]) == 1
    assert response.json["data"]["users"][0]["user_id"] == str(user.user_id)
    assert response.json["data"]["users"][0]["email"] == user.email


def test_application_get_includes_organization_with_sam_gov_entity(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that application GET response includes organization with SAM.gov entity data"""
    # Create a SAM.gov entity with test data
    sam_gov_entity = SamGovEntityFactory.create(
        legal_business_name="Test Organization LLC",
        expiration_date=date(2025, 12, 31),
        ebiz_poc_email="ebiz@testorg.com",
        ebiz_poc_first_name="Jane",
        ebiz_poc_last_name="Doe",
    )

    # Create an organization linked to the SAM.gov entity
    organization = OrganizationFactory.create(sam_gov_entity=sam_gov_entity)

    # Create an application with the organization
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        application_name="Test Application with Organization",
        organization=organization,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Check that organization is included
    assert "organization" in response.json["data"]
    assert response.json["data"]["organization"] is not None
    assert response.json["data"]["organization"]["organization_id"] == str(
        organization.organization_id
    )

    # Check that sam_gov_entity is included with the required fields
    sam_gov_data = response.json["data"]["organization"]["sam_gov_entity"]
    assert sam_gov_data is not None
    assert sam_gov_data["uei"] == sam_gov_entity.uei
    assert sam_gov_data["legal_business_name"] == "Test Organization LLC"
    assert sam_gov_data["expiration_date"] == "2025-12-31"
    assert sam_gov_data["ebiz_poc_email"] == "ebiz@testorg.com"
    assert sam_gov_data["ebiz_poc_first_name"] == "Jane"
    assert sam_gov_data["ebiz_poc_last_name"] == "Doe"


def test_application_get_includes_organization_without_sam_gov_entity(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that application GET response includes organization without SAM.gov entity data"""
    # Create an organization without a SAM.gov entity
    organization = OrganizationFactory.create(sam_gov_entity=None)

    # Create an application with the organization
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        application_name="Test Application with Organization",
        organization=organization,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Check that organization is included but sam_gov_entity is null
    assert "organization" in response.json["data"]
    assert response.json["data"]["organization"] is not None
    assert response.json["data"]["organization"]["organization_id"] == str(
        organization.organization_id
    )
    assert response.json["data"]["organization"]["sam_gov_entity"] is None


def test_application_get_without_organization(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that application GET response handles null organization correctly"""
    # Create an application without an organization
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        application_name="Test Application without Organization",
        organization=None,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Check that organization field is present but null
    assert "organization" in response.json["data"]
    assert response.json["data"]["organization"] is None


def test_application_start_with_organization_success(
    client,
    enable_factory_create,
    db_session,
):
    """Test successful creation of an application with an organization"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create organization and associate user with required privileges
    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )
    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created with the organization
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id
    assert str(application.organization_id) == organization_id
    assert application.application_status == ApplicationStatus.IN_PROGRESS

    # Assert it does create an application user
    assert not application.application_users

    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.APPLICATION_CREATED
    )
    assert application.application_audits[0].user_id == user.user_id


def test_application_start_with_organization_and_custom_name(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation with organization and custom name"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create organization and associate user,with required privileges
    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    custom_name = "My Custom Application"
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
        "application_name": custom_name,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created with the organization and custom name
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id
    assert str(application.organization_id) == organization_id
    assert application.application_name == custom_name
    assert application.application_status == ApplicationStatus.IN_PROGRESS


def test_application_start_organization_not_found(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation fails when organization doesn't exist"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    nonexistent_organization_id = str(uuid.uuid4())  # Random UUID that doesn't exist
    request_data = {
        "competition_id": competition_id,
        "organization_id": nonexistent_organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 404
    assert "Organization not found" in response.json["message"]

    # Verify no application was created
    applications_count = (
        db_session.execute(select(Application).where(Application.competition_id == competition_id))
        .scalars()
        .all()
    )
    assert len(applications_count) == 0


def test_application_start_without_organization_still_works(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that application creation still works without organization_id (backward compatibility)"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        # No organization_id provided
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created without organization
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id
    assert application.organization_id is None
    assert application.application_status == ApplicationStatus.IN_PROGRESS


def test_application_start_with_null_organization_id(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that application creation works with explicit null organization_id"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": None,  # Explicitly set to null
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created without organization
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id
    assert application.organization_id is None
    assert application.application_status == ApplicationStatus.IN_PROGRESS


def test_application_start_invalid_organization_id_format(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation fails with invalid organization_id format"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": "invalid-uuid-format",  # Invalid UUID format
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 422
    assert "validation error" in response.json["message"].lower()

    # Verify no application was created
    applications_count = (
        db_session.execute(select(Application).where(Application.competition_id == competition_id))
        .scalars()
        .all()
    )
    assert len(applications_count) == 0


def test_application_start_organization_membership_validation_works_with_multiple_users(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that organization membership validation works correctly with multiple users"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create two users - one is member, one is not
    # Associate only the first user with the organization with required privileges
    user_member, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )
    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)
    #  non-member
    user_non_member = UserFactory.create()

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    # Test with member user - should succeed
    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Test with non-member user - should fail
    non_member_token, _ = create_jwt_for_user(user_non_member, db_session)
    db_session.commit()
    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": non_member_token}
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_application_form_get_with_internal_jwt_bypasses_auth(
    client, enable_factory_create, db_session
):
    """Test that internal JWT auth bypasses user access checks for application form endpoint"""
    # Create an application form that is NOT associated with any user
    application_form = ApplicationFormFactory.create(
        application_response={"name": "John Doe", "age": 30}
    )

    # Create the competition form relationship
    CompetitionFormFactory.create(
        competition=application_form.application.competition,
        form=application_form.form,
        is_required=True,
    )

    db_session.commit()

    # Create an internal JWT token
    expires_at = datetime_util.utcnow() + timedelta(hours=1)
    internal_token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
    )
    db_session.commit()

    # Make request with internal JWT token
    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Internal-Token": internal_token},
    )

    # Should succeed even though no user is associated with the application
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)
    assert response.json["data"]["application_response"] == {"name": "John Doe", "age": 30}


def test_application_form_get_with_internal_jwt_vs_regular_jwt(
    client, enable_factory_create, db_session, user
):
    """Test that regular JWT still requires user access while internal JWT bypasses it"""
    # Create an application form that is NOT associated with the test user
    other_user = UserFactory.create()
    application_form = ApplicationFormFactory.create(
        application_response={"name": "Jane Doe", "age": 25}
    )

    # Associate the application with a different user (not the test user)
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(
            user=other_user, application=application_form.application
        ),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Create the competition form relationship
    CompetitionFormFactory.create(
        competition=application_form.application.competition,
        form=application_form.form,
        is_required=True,
    )

    db_session.commit()

    # Create regular user JWT token for the test user (who is NOT associated with the application)
    user_token, _ = create_jwt_for_user(user, db_session)

    # Create internal JWT token
    expires_at = datetime_util.utcnow() + timedelta(hours=1)
    internal_token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
    )
    db_session.commit()

    # Regular JWT should fail with 403 because user is not associated with the application
    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_token},
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]

    # Internal JWT should succeed
    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Internal-Token": internal_token},
    )
    assert response.status_code == 200
    assert response.json["message"] == "Success"


def test_application_form_get_with_internal_jwt_nonexistent_application(
    client, enable_factory_create, db_session
):
    """Test that internal JWT still validates that the application exists"""
    nonexistent_id = str(uuid.uuid4())
    nonexistent_form_id = str(uuid.uuid4())

    # Create internal JWT token
    expires_at = datetime_util.utcnow() + timedelta(hours=1)
    internal_token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
    )
    db_session.commit()

    # Should still return 404 for nonexistent application
    response = client.get(
        f"/alpha/applications/{nonexistent_id}/application_form/{nonexistent_form_id}",
        headers={"X-SGG-Internal-Token": internal_token},
    )
    assert response.status_code == 404
    assert "Application with ID" in response.json["message"]


def test_application_start_organization_not_allowed(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation fails when applying as organization but competition only allows individuals"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create organization and associate user with it

    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )
    # Create competition that only allows individual applicants
    competition = CompetitionFactory.create(
        opening_date=today,
        closing_date=future_date,
        open_to_applicants=[CompetitionOpenToApplicant.INDIVIDUAL],
    )

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,  # Applying as organization
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 422
    assert "This competition does not allow organization applications" in response.json["message"]

    # Verify no application was created
    applications_count = (
        db_session.execute(select(Application).where(Application.competition_id == competition_id))
        .scalars()
        .all()
    )
    assert len(applications_count) == 0


def test_application_start_individual_on_org_only_competition_allowed(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation succeeds when applying as individual even when competition only allows organizations

    Individuals can start applications for org-only competitions and add an organization later.
    """
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create competition that only allows organization applicants
    competition = CompetitionFactory.create(
        opening_date=today,
        closing_date=future_date,
        open_to_applicants=[CompetitionOpenToApplicant.ORGANIZATION],
    )

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        # No organization_id - applying as individual
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    # Should succeed - individuals can start applications and add organization later
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert application.organization_id is None


def test_application_start_organization_allowed(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation succeeds when applying as organization and competition allows organizations"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create organization and associate user with required privileges
    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )

    # Create competition that allows organization applicants
    competition = CompetitionFactory.create(
        opening_date=today,
        closing_date=future_date,
        open_to_applicants=[CompetitionOpenToApplicant.ORGANIZATION],
    )

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,  # Applying as organization
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created with organization
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.organization_id) == organization_id


def test_application_start_individual_allowed(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation succeeds when applying as individual and competition allows individuals"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create competition that allows individual applicants
    competition = CompetitionFactory.create(
        opening_date=today,
        closing_date=future_date,
        open_to_applicants=[CompetitionOpenToApplicant.INDIVIDUAL],
    )

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        # No organization_id - applying as individual
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created without organization
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert application.organization_id is None


def test_application_start_both_applicant_types_allowed(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation succeeds when both individual and organization applicants are allowed"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create organization and associate user with required privileges
    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION]
    )

    # Create competition that allows both individual and organization applicants
    competition = CompetitionFactory.create(
        opening_date=today,
        closing_date=future_date,
        open_to_applicants=[
            CompetitionOpenToApplicant.INDIVIDUAL,
            CompetitionOpenToApplicant.ORGANIZATION,
        ],
    )

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)

    # Test applying as individual (no organization_id)
    request_data_individual = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start",
        json=request_data_individual,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Test applying as organization
    request_data_organization = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    response = client.post(
        "/alpha/applications/start",
        json=request_data_organization,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify both applications were created
    applications_count = (
        db_session.execute(select(Application).where(Application.competition_id == competition_id))
        .scalars()
        .all()
    )
    assert len(applications_count) == 2


def test_application_form_inclusion_update_success_true(
    client,
    enable_factory_create,
    db_session,
):
    """Test successfully setting form inclusion to true"""
    # Create application with a form
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(competition=application.competition, form=form)

    # Create an application form with some data but no inclusion flag set
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "John Doe"},
        is_included_in_submission=None,
    )

    application_id = str(application.application_id)
    form_id = str(form.form_id)
    request_data = {"is_included_in_submission": True}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}/inclusion",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.FORM_UPDATED
    )
    assert application.application_audits[0].user_id == user.user_id
    assert (
        application.application_audits[0].target_application_form_id
        == application_form.application_form_id
    )


def test_application_start_organization_no_sam_gov_entity(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation succeeds even when organization has no SAM.gov entity record

    The validation error will appear during GET/submit, not during start.
    """
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create organization WITHOUT sam.gov entity
    user, organization, token = create_user_in_org(
        db_session=db_session, privileges=[Privilege.START_APPLICATION], without_sam_gov_entity=True
    )

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    # Should succeed - validation happens during GET/submit, not start
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.organization_id) == organization_id


def test_application_start_organization_expired_entity(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation succeeds even when organization's SAM.gov entity has expired

    The validation error will appear during GET/submit, not during start.
    """
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)
    past_expiration_date = today - timedelta(days=30)  # Expired 30 days ago

    # Create organization with expired sam.gov entity
    sam_gov_entity = SamGovEntityFactory.create(
        expiration_date=past_expiration_date, is_inactive=False
    )
    user, organization, token = create_user_in_org(
        db_session=db_session,
        privileges=[Privilege.START_APPLICATION],
        sam_gov_entity=sam_gov_entity,
    )

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    # Should succeed - validation happens during GET/submit, not start
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.organization_id) == organization_id


def test_application_start_organization_inactive_entity(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation succeeds even when organization's SAM.gov entity is inactive

    The validation error will appear during GET/submit, not during start.
    """
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)
    future_expiration_date = today + timedelta(days=365)  # Valid expiration date

    # Create organization with inactive sam.gov entity
    sam_gov_entity = SamGovEntityFactory.create(
        expiration_date=future_expiration_date, is_inactive=True
    )
    user, organization, token = create_user_in_org(
        db_session=db_session,
        privileges=[Privilege.START_APPLICATION],
        sam_gov_entity=sam_gov_entity,
    )
    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    # Should succeed - validation happens during GET/submit, not start
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.organization_id) == organization_id


def test_application_start_organization_valid_entity_success(
    client,
    enable_factory_create,
    db_session,
):
    """Test successful application creation when organization has valid (not expired and not inactive) SAM.gov entity"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)
    future_expiration_date = today + timedelta(days=365)  # Valid expiration date

    # Create organization with valid sam.gov entity
    sam_gov_entity = SamGovEntityFactory.create(
        expiration_date=future_expiration_date, is_inactive=False
    )

    user, organization, token = create_user_in_org(
        db_session=db_session,
        privileges=[Privilege.START_APPLICATION],
        sam_gov_entity=sam_gov_entity,
    )

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]


def test_application_form_inclusion_update_success_false(
    client,
    enable_factory_create,
    db_session,
):
    """Test successfully setting form inclusion to false"""
    # Create application with a form
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(competition=application.competition, form=form)

    # Create an application form with inclusion initially set to true
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "John Doe"},
        is_included_in_submission=True,
    )

    application_id = str(application.application_id)
    form_id = str(form.form_id)
    request_data = {"is_included_in_submission": False}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}/inclusion",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created with the organization
    competition_id = str(application.competition_id)
    organization_id = str(application.organization_id)
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    # Verify application was created with the organization
    assert application is not None
    assert str(application.competition_id) == competition_id
    assert str(application.organization_id) == organization_id
    assert application.application_status == ApplicationStatus.IN_PROGRESS

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.FORM_UPDATED
    )
    assert application.application_audits[0].user_id == user.user_id
    assert (
        application.application_audits[0].target_application_form_id
        == application_form.application_form_id
    )


def test_application_start_organization_entity_expiring_today(
    client, enable_factory_create, db_session
):
    """Test application creation fails when organization's SAM.gov entity expires today"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create organization with sam.gov entity expiring today
    sam_gov_entity = SamGovEntityFactory.create(expiration_date=today, is_inactive=False)
    user, organization, token = create_user_in_org(
        db_session=db_session,
        privileges=[Privilege.START_APPLICATION],
        sam_gov_entity=sam_gov_entity,
    )

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    # Should succeed as expiration_date is today (not in the past)
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]


def test_application_start_organization_entity_expiring_yesterday(
    client,
    enable_factory_create,
    db_session,
):
    """Test application creation succeeds even when organization's SAM.gov entity expired yesterday

    The validation error will appear during GET/submit, not during start.
    """
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)
    yesterday = today - timedelta(days=1)

    # Create organization with sam.gov entity that expired yesterday
    sam_gov_entity = SamGovEntityFactory.create(expiration_date=yesterday, is_inactive=False)
    user, organization, token = create_user_in_org(
        db_session=db_session,
        privileges=[Privilege.START_APPLICATION],
        sam_gov_entity=sam_gov_entity,
    )
    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    organization_id = str(organization.organization_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    # Should succeed - validation happens during GET/submit, not start
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created
    application_id = response.json["data"]["application_id"]
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.organization_id) == organization_id


def test_application_form_inclusion_update_application_form_not_found(
    client,
    enable_factory_create,
    db_session,
):
    """Test form inclusion update fails when application form doesn't exist"""
    # Create application and form, but no application form record
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    form = FormFactory.create()
    CompetitionFormFactory.create(competition=application.competition, form=form)
    application_id = str(application.application_id)
    form_id = str(form.form_id)
    request_data = {"is_included_in_submission": True}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}/inclusion",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    assert "Application form not found" in response.json["message"]


def test_application_form_inclusion_update_invalid_request_missing_field(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application form inclusion update with missing is_included_in_submission field"""
    application = ApplicationFactory.create()

    competition_form = CompetitionFormFactory.create(competition=application.competition)
    ApplicationUserFactory.create(user=user, application=application)

    request_data = {}  # Missing is_included_in_submission

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{competition_form.form_id}/inclusion",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 422


def test_application_start_with_pre_population(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that starting an application triggers pre-population of form fields"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    # Create an opportunity with specific data for pre-population
    opportunity = OpportunityFactory.create(
        opportunity_number="TEST-OPP-123",
        opportunity_title="Test Opportunity Title",
    )

    competition = CompetitionFactory.create(
        opening_date=today, closing_date=future_date, opportunity=opportunity
    )

    # Create a form with pre-population rules
    form_rule_schema = {
        "opportunity_number_field": {"gg_pre_population": {"rule": "opportunity_number"}},
        "opportunity_title_field": {"gg_pre_population": {"rule": "opportunity_title"}},
    }

    form = FormFactory.create(form_rule_schema=form_rule_schema)
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    application_id = response.json["data"]["application_id"]

    # Verify that the application form was created with pre-populated values
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application_id,
            ApplicationForm.competition_form_id == competition_form.competition_form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response["opportunity_number_field"] == "TEST-OPP-123"
    assert (
        application_form.application_response["opportunity_title_field"] == "Test Opportunity Title"
    )


def test_application_form_update_with_pre_population(
    client,
    enable_factory_create,
    db_session,
):
    """Test that updating an application form triggers pre-population of new fields"""
    # Create application
    opportunity = OpportunityFactory.create(
        opportunity_number="UPDATE-OPP-456", opportunity_title="Updated Opportunity Title"
    )

    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    application.competition.opportunity = opportunity

    # Create a form with pre-population rules
    form_rule_schema = {
        "opportunity_number_field": {"gg_pre_population": {"rule": "opportunity_number"}},
        "user_input_field": {
            # No rule - user can modify this
        },
    }

    form = FormFactory.create(
        form_json_schema=SIMPLE_JSON_SCHEMA, form_rule_schema=form_rule_schema
    )

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )
    application_id = str(application.application_id)
    form_id = str(competition_form.form_id)

    # Update with user data - should trigger pre-population
    request_data = {"application_response": {"user_input_field": "User provided data"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application form was updated with both user data and pre-populated values
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.competition_form_id == competition_form.competition_form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    # Should have user data
    assert application_form.application_response["user_input_field"] == "User provided data"
    # Should also have pre-populated data
    assert application_form.application_response["opportunity_number_field"] == "UPDATE-OPP-456"

    # Verify audit event added
    assert len(application.application_audits) == 1
    assert (
        application.application_audits[0].application_audit_event
        == ApplicationAuditEvent.FORM_UPDATED
    )
    assert application.application_audits[0].user_id == user.user_id
    assert (
        application.application_audits[0].target_application_form_id
        == application_form.application_form_id
    )


def test_application_form_update_overwrites_user_changes_with_pre_population(
    client,
    enable_factory_create,
    db_session,
):
    """Test that pre-population overwrites user values for pre-populated fields"""
    # Create application
    opportunity = OpportunityFactory.create(opportunity_number="PRESERVE-OPP-789")

    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    application.competition.opportunity = opportunity

    # Create a form with pre-population rules
    form_rule_schema = {
        "opportunity_number_field": {"gg_pre_population": {"rule": "opportunity_number"}}
    }

    form = FormFactory.create(form_rule_schema=form_rule_schema)

    competition_form = CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create existing application form with user-modified pre-populated field
    existing_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"opportunity_number_field": "User Changed This Value"},
    )

    request_data = {
        "application_response": {"opportunity_number_field": "User Tried To Change Again"}
    }

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200

    # Verify application form was updated with pre-populated value, not user value
    db_session.refresh(existing_form)

    # Pre-population should override user input
    assert existing_form.application_response["opportunity_number_field"] == "PRESERVE-OPP-789"


def test_application_form_get_with_submitted_application_status(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that application_status field correctly reflects submitted application status"""
    # Create an application with SUBMITTED status
    application = ApplicationFactory.create(application_status=ApplicationStatus.SUBMITTED)

    application_form = ApplicationFormFactory.create(
        application=application,
        application_response={"name": "John Doe"},
    )

    CompetitionFormFactory.create(
        competition=application_form.application.competition,
        form=application_form.form,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(
            user=user, application=application_form.application
        ),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    # Verify application_status field reflects the submitted status
    assert response.json["data"]["application_status"] == ApplicationStatus.SUBMITTED


def test_application_start_forbidden(
    client,
    enable_factory_create,
    db_session,
):
    """Test that a user without the required privileges cannot start an application owned by an organization"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=10)

    user, organization, token = create_user_in_org(
        db_session=db_session,
        privileges=[Privilege.VIEW_APPLICATION],
    )

    competition = CompetitionFactory.create(opening_date=today, closing_date=future_date)

    competition_id = str(competition.competition_id)
    request_data = {
        "competition_id": competition_id,
        "organization_id": organization.organization_id,
    }

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_application_form_update_create_403_access(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test forbidden creation of an application form response"""
    # Create application
    application = ApplicationFactory.create()

    competition_form = CompetitionFormFactory.create(competition=application.competition)

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

    application_id = str(application.application_id)
    form_id = str(competition_form.form_id)
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert
    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_application_form_inclusion_update_403_access(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test forbidden setting form inclusion to true"""
    # Create application with a form
    application = ApplicationFactory.create()
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(competition=application.competition, form=form)

    # Create an application form with some data but no inclusion flag set
    ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "John Doe"},
        is_included_in_submission=None,
    )

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)
    application_id = str(application.application_id)
    form_id = str(form.form_id)
    request_data = {"is_included_in_submission": True}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}/inclusion",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_get_application_access_403(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that user can not access the application without correct privilege"""
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)
    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403


def test_get_application_form_access_403(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that user can not access the application without correct privilege"""
    application = ApplicationFactory.create()
    application_form = ApplicationFormFactory.create(
        application=application,
        application_response={"name": "John Doe"},
    )

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)
    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403


def test_get_application_form_access_with_organization(
    client,
    enable_factory_create,
    db_session,
):
    """Test that user can access the application if organization member"""
    # Associate user with organization
    _, org, token = create_user_in_org(db_session, privileges=[Privilege.VIEW_APPLICATION])
    # Create application owned by org
    application = ApplicationFactory.create(organization=org)
    application_form = ApplicationFormFactory.create(
        application=application,
        application_response={"name": "John Doe"},
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"


def test_add_organization_to_application_success(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test successfully adding an organization to an application via route"""
    # Create a competition that allows organization applications
    competition = CompetitionFactory.create(
        open_to_applicants={
            CompetitionOpenToApplicant.INDIVIDUAL,
            CompetitionOpenToApplicant.ORGANIZATION,
        }
    )

    # Create an application without an organization
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Associate user with application (MODIFY_APPLICATION privilege)
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Add a second user to the app that will also be removed
    second_user = ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    ).application_user

    # Create organization and give user START_APPLICATION privilege
    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    # Make the PUT request
    response = client.put(
        f"/alpha/applications/{application.application_id}/organizations/{organization.organization_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_id"] == str(application.application_id)

    # Verify the organization was added in the database
    db_session.refresh(application)
    assert application.organization_id == organization.organization_id

    # Application users were removed
    assert application.application_users == []

    assert len(application.application_audits) == 3
    assert {a.application_audit_event for a in application.application_audits} == {
        ApplicationAuditEvent.ORGANIZATION_ADDED,
        ApplicationAuditEvent.USER_REMOVED,
    }

    for app_audit in application.application_audits:
        assert app_audit.user_id == user.user_id
        if app_audit.application_audit_event == ApplicationAuditEvent.USER_REMOVED:
            assert app_audit.target_user_id in (user.user_id, second_user.user_id)


def test_add_organization_to_application_not_found(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test adding organization fails when application doesn't exist"""
    organization = OrganizationFactory.create()
    non_existent_application_id = uuid.uuid4()

    response = client.put(
        f"/alpha/applications/{non_existent_application_id}/organizations/{organization.organization_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert "Application not found" in response.json["message"]


def test_add_organization_organization_not_found(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test adding organization fails when organization doesn't exist"""
    competition = CompetitionFactory.create()
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    non_existent_organization_id = uuid.uuid4()

    response = client.put(
        f"/alpha/applications/{application.application_id}/organizations/{non_existent_organization_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert (
        f"Could not find Organization with ID {non_existent_organization_id}"
        in response.json["message"]
    )


def test_add_organization_no_modify_application_privilege(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test adding organization fails when user doesn't have MODIFY_APPLICATION privilege"""
    competition = CompetitionFactory.create()
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Associate user with application but without MODIFY_APPLICATION privilege
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    response = client.put(
        f"/alpha/applications/{application.application_id}/organizations/{organization.organization_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_add_organization_no_start_application_privilege(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test adding organization fails when user doesn't have START_APPLICATION privilege"""
    competition = CompetitionFactory.create(
        open_to_applicants={CompetitionOpenToApplicant.ORGANIZATION}
    )
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Associate user with application with MODIFY_APPLICATION privilege
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Create organization but user doesn't have START_APPLICATION privilege
    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.VIEW_ORG_MEMBERSHIP]),
    )

    response = client.put(
        f"/alpha/applications/{application.application_id}/organizations/{organization.organization_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_application_get_shows_expired_org_warning(client, enable_factory_create, db_session):
    """Test that GET application shows warning when organization has expired SAM.gov entity"""
    today = get_now_us_eastern_date()
    past_expiration_date = today - timedelta(days=30)

    # Create organization with expired sam.gov entity
    sam_gov_entity = SamGovEntityFactory.create(
        expiration_date=past_expiration_date, is_inactive=False
    )
    user, organization, token = create_user_in_org(
        db_session=db_session,
        privileges=[Privilege.START_APPLICATION, Privilege.VIEW_APPLICATION],
        sam_gov_entity=sam_gov_entity,
    )

    competition = CompetitionFactory.create()

    # Start an application with the expired org
    application = ApplicationFactory.create(
        competition=competition,
        organization=organization,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # GET the application
    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    # Check for warnings about expired org
    assert "warnings" in response.json
    warnings = response.json["warnings"]

    # Verify there's a warning about the expired SAM.gov registration
    expired_warning_found = any(
        "SAM.gov registration expired" in str(warning.get("message", "")) for warning in warnings
    )
    assert expired_warning_found, "Expected warning about expired SAM.gov registration not found"


def test_application_submit_fails_with_expired_org(client, enable_factory_create, db_session):
    """Test that SUBMIT application fails with 422 when organization has expired SAM.gov entity"""
    today = get_now_us_eastern_date()
    past_expiration_date = today - timedelta(days=30)

    # Create organization with expired sam.gov entity
    sam_gov_entity = SamGovEntityFactory.create(
        expiration_date=past_expiration_date, is_inactive=False
    )
    user, organization, token = create_user_in_org(
        db_session=db_session,
        privileges=[Privilege.START_APPLICATION, Privilege.SUBMIT_APPLICATION],
        sam_gov_entity=sam_gov_entity,
    )

    # Create a simple competition with a form
    competition = CompetitionFactory.create()
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)
    competition_form = CompetitionFormFactory.create(
        competition=competition, form=form, is_required=True
    )

    # Create application with the expired org
    application = ApplicationFactory.create(
        competition=competition,
        organization=organization,
        application_status=ApplicationStatus.IN_PROGRESS,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.SUBMIT_APPLICATION]),
    )

    # Add a valid form response
    ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={"name": "Test Name"},
    )

    # Try to submit the application
    response = client.post(
        f"/alpha/applications/{application.application_id}/submit",
        headers={"X-SGG-Token": token},
    )

    # Should fail with 422
    assert response.status_code == 422

    # Check that the error mentions the expired SAM.gov registration
    response_text = str(response.json)
    assert (
        "SAM.gov registration expired" in response_text
    ), "Expected error about expired SAM.gov registration not found in response"
