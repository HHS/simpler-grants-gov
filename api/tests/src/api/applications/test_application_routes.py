import uuid
from datetime import date, timedelta

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import ApplicationFormStatus
from src.db.models.competition_models import Application, ApplicationForm, ApplicationStatus
from src.db.models.user_models import ApplicationUser
from src.util.datetime_util import get_now_us_eastern_date
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    OpportunityFactory,
    OrganizationFactory,
    SamGovEntityFactory,
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
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation fails when current date is before opening_date"""
    today = get_now_us_eastern_date()
    future_opening_date = today + timedelta(days=5)
    future_closing_date = today + timedelta(days=15)

    competition = CompetitionFactory.create(
        opening_date=future_opening_date, closing_date=future_closing_date
    )

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
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
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation fails when current date is after closing_date"""
    today = get_now_us_eastern_date()
    past_opening_date = today - timedelta(days=15)
    past_closing_date = today - timedelta(days=5)

    competition = CompetitionFactory.create(
        opening_date=past_opening_date, closing_date=past_closing_date, grace_period=0
    )

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
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
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application creation fails when after grace period"""
    today = get_now_us_eastern_date()
    past_opening_date = today - timedelta(days=20)
    past_closing_date = today - timedelta(days=10)
    grace_period = 5  # 5 days grace period

    competition = CompetitionFactory.create(
        opening_date=past_opening_date, closing_date=past_closing_date, grace_period=grace_period
    )

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-SGG-Token": user_auth_token}
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
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test successful creation of an application form response"""
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


def test_application_form_update_success_update(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test successful update of an existing application form response"""
    # Create application
    application = ApplicationFactory.create()

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

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

    request_data = {"application_response": {"name": "Updated Name"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["warnings"] == []

    # Verify application form was updated in the database
    db_session.refresh(existing_form)
    assert existing_form.application_response == {"name": "Updated Name"}


@pytest.mark.parametrize(
    "application_response,expected_warnings,expected_form_status",
    [
        # Missing required field
        (
            {},
            [
                {
                    "field": "$",
                    "message": "'name' is a required property",
                    "type": "required",
                    "value": None,
                }
            ],
            ApplicationFormStatus.NOT_STARTED,
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
    user,
    user_auth_token,
    application_response,
    expected_warnings,
    expected_form_status,
):
    application = ApplicationFactory.create()

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

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

    request_data = {"application_response": application_response}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_status"] == expected_form_status
    assert response.json["warnings"] == expected_warnings

    # Verify application form was updated in the database
    db_session.refresh(existing_application_form)
    assert existing_application_form.application_response == application_response


def test_application_form_update_with_invalid_schema_500(
    client,
    enable_factory_create,
    db_session,
    user,
    user_auth_token,
):
    """In this test we intentionally create a bad JSON schema"""
    application = ApplicationFactory.create()

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

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

    request_data = {"application_response": {"name": "Changed Name"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal Server Error"
    # Verify the response was not updated
    db_session.refresh(existing_application_form)
    assert existing_application_form.application_response == {"name": "Original Name"}


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
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application form update fails when form doesn't exist"""

    # Create application
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

    application_id = str(application.application_id)
    non_existent_form_id = str(uuid.uuid4())
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{non_existent_form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
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
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application form update with complex JSON data"""
    # Create application
    application = ApplicationFactory.create()

    competition_form = CompetitionFormFactory.create(competition=application.competition)

    application_form = ApplicationFormFactory.create(
        application=application, competition_form=competition_form
    )

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

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
        headers={"X-SGG-Token": user_auth_token},
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
    ApplicationUserFactory.create(user=user, application=application_form.application)

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
    client, enable_factory_create, db_session, user, user_auth_token
):
    application = ApplicationFactory.create()

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

    non_existent_app_form_id = str(uuid.uuid4())

    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{non_existent_app_form_id}",
        headers={"X-SGG-Token": user_auth_token},
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


def test_application_get_success(client, enable_factory_create, db_session, user, user_auth_token):
    application = ApplicationFactory.create(with_forms=True)
    application_forms = sorted(application.application_forms, key=lambda x: x.application_form_id)

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

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
        assert application_form_response == {
            "application_form_id": str(application_form.application_form_id),
            "application_id": str(application.application_id),
            "form_id": str(application_form.form_id),
            "application_response": application_form.application_response,
            "application_form_status": ApplicationFormStatus.IN_PROGRESS,
        }


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
    ApplicationUserFactory.create(user=user, application=application)

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
            "field": "$",
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
            "field": "$",
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
                    "field": "$",
                    "message": "'name' is a required property",
                    "type": "required",
                    "value": None,
                }
            ],
            ApplicationFormStatus.NOT_STARTED,
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
    ApplicationUserFactory.create(user=user, application=application)

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
    ApplicationUserFactory.create(user=user, application=application)

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
    ApplicationUserFactory.create(user=user, application=application)

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

    ApplicationUserFactory.create(application=application, user=user)

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


def test_application_submit_missing_required_form(
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

    ApplicationUserFactory.create(application=application, user=user)

    # Setup an application form without any answers yet
    ApplicationFormFactory.create(
        application=application, competition_form=competition_form, application_response={}
    )

    response = client.post(
        f"/alpha/applications/{application.application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Assert response
    assert response.status_code == 422
    assert response.json["message"] == "The application has issues in its form responses."
    assert response.json["errors"] == [
        {
            "field": "form_id",
            "message": "Form ExampleForm-ABC is required",
            "type": "missing_required_form",
            "value": str(form.form_id),
        }
    ]


@pytest.mark.parametrize(
    "initial_status", [ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED]
)
def test_application_form_update_forbidden_not_in_progress(
    client, enable_factory_create, db_session, user, user_auth_token, initial_status
):
    """Test form update fails if application is not in IN_PROGRESS status"""
    # Create an application with a status other than IN_PROGRESS
    application = ApplicationFactory.create(application_status=initial_status)

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

    form = FormFactory.create()
    CompetitionFormFactory.create(competition=application.competition, form=form)

    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
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


@pytest.mark.parametrize(
    "initial_status", [ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED]
)
def test_application_submit_forbidden_not_in_progress(
    client, enable_factory_create, db_session, user, user_auth_token, initial_status
):
    """Test submission fails if application is not in IN_PROGRESS status"""
    # Create an application with a status other than IN_PROGRESS
    application = ApplicationFactory.create(application_status=initial_status)
    application_id = str(application.application_id)

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

    response = client.post(
        f"/alpha/applications/{application_id}/submit",
        headers={"X-SGG-Token": user_auth_token},
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
    assert application_user.is_application_owner is True


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
    assert "Unauthorized" in response.json["message"]


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
    assert "Unauthorized" in response.json["message"]


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
    assert "Unauthorized" in response.json["message"]


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
    assert "Unauthorized" in response.json["message"]


def test_application_get_success_when_associated(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application get succeeds when user is associated with the application"""
    application = ApplicationFactory.create(with_forms=True)

    ApplicationUserFactory.create(application=application, user=user)

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
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

    ApplicationUserFactory.create(application=application_form.application, user=user)

    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)


def test_application_form_update_success_when_associated(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test application form update succeeds when user is associated with the application"""
    application = ApplicationFactory.create()

    competition_form = CompetitionFormFactory.create(competition=application.competition)

    ApplicationUserFactory.create(application=application, user=user)

    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{competition_form.form_id}",
        json=request_data,
        headers={"X-SGG-Token": user_auth_token},
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
    ApplicationUserFactory.create(application=application, user=user)

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

    # Associate user with application
    ApplicationUserFactory.create(user=user, application=application)

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
        uei="TEST123456789",
        legal_business_name="Test Organization LLC",
        expiration_date=date(2025, 12, 31),
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
    ApplicationUserFactory.create(user=user, application=application)

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
    assert sam_gov_data["uei"] == "TEST123456789"
    assert sam_gov_data["legal_business_name"] == "Test Organization LLC"
    assert sam_gov_data["expiration_date"] == "2025-12-31"


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
    ApplicationUserFactory.create(user=user, application=application)

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
    ApplicationUserFactory.create(user=user, application=application)

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Check that organization field is present but null
    assert "organization" in response.json["data"]
    assert response.json["data"]["organization"] is None
