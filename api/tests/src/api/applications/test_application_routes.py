import uuid

import pytest
from sqlalchemy import select

from src.db.models.competition_models import Application, ApplicationForm
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
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


def test_application_start_success(client, api_auth_token, enable_factory_create, db_session):
    """Test successful creation of an application"""
    competition = CompetitionFactory.create()

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-Auth": api_auth_token}
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "application_id" in response.json["data"]

    # Verify application was created in the database
    application_id = uuid.UUID(response.json["data"]["application_id"])
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    assert application is not None
    assert str(application.competition_id) == competition_id


def test_application_start_competition_not_found(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application creation fails when competition doesn't exist"""
    non_existent_competition_id = str(uuid.uuid4())
    request_data = {"competition_id": non_existent_competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-Auth": api_auth_token}
    )

    assert response.status_code == 404
    assert (
        f"Competition with ID {non_existent_competition_id} not found" in response.json["message"]
    )

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

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-Auth": "123"}
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
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application creation fails with invalid request data"""
    application_count_before = len(db_session.execute(select(Application)).scalars().all())

    request_data = {"my_field": {"a": 1, "b": [{"c": "hello"}]}}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-Auth": api_auth_token}
    )

    assert response.status_code == 422  # Validation error

    # Verify no application was created
    applications_count = db_session.execute(select(Application)).scalars().all()
    assert len(applications_count) == application_count_before


def test_application_form_update_success_create(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test successful creation of an application form response"""
    # Create application
    application = ApplicationFactory.create()

    competition_form = CompetitionFormFactory.create(competition=application.competition)

    application_id = str(application.application_id)
    form_id = str(competition_form.form_id)
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
    )

    # Assert
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_id"] == application_id
    assert "warnings" in response.json

    # Verify application form was created in the database
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.form_id == competition_form.form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == {"name": "John Doe"}


def test_application_form_update_success_update(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test successful update of an existing application form response"""
    # Create application
    application = ApplicationFactory.create()

    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_form = ApplicationFormFactory.create(
        application=application,
        form=form,
        application_response={"name": "Original Name"},
    )

    application_id = str(application.application_id)
    form_id = str(existing_form.form_id)
    request_data = {"application_response": {"name": "Updated Name"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["warnings"] == []

    # Verify application form was updated in the database
    db_session.refresh(existing_form)
    assert existing_form.application_response == {"name": "Updated Name"}


@pytest.mark.parametrize(
    "application_response,expected_warnings",
    [
        # Missing required field
        ({}, [{"field": "$", "message": "'name' is a required property", "type": "required"}]),
        # Validation on age field
        (
            {"name": "bob", "age": 500},
            [
                {
                    "field": "$.age",
                    "message": "500 is greater than the maximum of 200",
                    "type": "maximum",
                }
            ],
        ),
        # Extra fields are fine with our setup
        ({"name": "bob", "age": 50, "something_else": ""}, []),
    ],
)
def test_application_form_update_with_validation_warnings(
    client,
    enable_factory_create,
    db_session,
    api_auth_token,
    application_response,
    expected_warnings,
):
    application = ApplicationFactory.create()

    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_application_form = ApplicationFormFactory.create(
        application=application,
        form=form,
        application_response={"name": "Original Name"},
    )

    request_data = {"application_response": application_response}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["warnings"] == expected_warnings

    # Verify application form was updated in the database
    db_session.refresh(existing_application_form)
    assert existing_application_form.application_response == application_response


def test_application_form_update_with_invalid_schema_500(
    client,
    enable_factory_create,
    db_session,
    api_auth_token,
):
    """In this test we intentionally create a bad JSON schema"""
    application = ApplicationFactory.create()

    form = FormFactory.create(form_json_schema={"properties": ["bad"]})

    CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    existing_application_form = ApplicationFormFactory.create(
        application=application,
        form=form,
        application_response={"name": "Original Name"},
    )

    request_data = {"application_response": {"name": "Changed Name"}}

    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{form.form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal Server Error"
    # Verify the response was not updated
    db_session.refresh(existing_application_form)
    assert existing_application_form.application_response == {"name": "Original Name"}


def test_application_form_update_application_not_found(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application form update fails when application doesn't exist"""
    # Create form
    form = FormFactory.create()

    non_existent_application_id = str(uuid.uuid4())
    form_id = str(form.form_id)
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{non_existent_application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
    )

    # Assert
    assert response.status_code == 404
    assert (
        f"Application with ID {non_existent_application_id} not found" in response.json["message"]
    )

    # Verify no application form was created
    application_forms = (
        db_session.execute(select(ApplicationForm).where(ApplicationForm.form_id == form_id))
        .scalars()
        .all()
    )
    assert len(application_forms) == 0


def test_application_form_update_form_not_found(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application form update fails when form doesn't exist"""

    # Create application
    application = ApplicationFactory.create()

    application_id = str(application.application_id)
    non_existent_form_id = str(uuid.uuid4())
    request_data = {"application_response": {"name": "John Doe"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{non_existent_form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
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
        headers={"X-Auth": "invalid-token"},
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
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application form update fails with invalid request data"""
    request_data = {}  # Missing required application_response

    application = ApplicationFactory.create()

    # Act
    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{uuid.uuid4()}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
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
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application form update with complex JSON data"""
    # Create application
    application = ApplicationFactory.create()

    application_form = ApplicationFormFactory.create(
        application=application,
    )

    CompetitionFormFactory.create(
        competition=application.competition,
        form=application_form.form,
    )

    application_id = str(application.application_id)
    form_id = str(application_form.form_id)
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
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
    )

    # Assert
    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application form was created with complex JSON
    db_session.expunge_all()
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.form_id == application_form.form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == complex_json


def test_application_form_get_success(client, enable_factory_create, db_session, api_auth_token):
    application_form = ApplicationFormFactory.create(
        application_response={"name": "John Doe"},
    )

    CompetitionFormFactory.create(
        competition=application_form.application.competition,
        form=application_form.form,
    )

    response = client.get(
        f"/alpha/applications/{application_form.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)
    assert response.json["data"]["application_id"] == str(application_form.application_id)
    assert response.json["data"]["form_id"] == str(application_form.form_id)
    assert response.json["data"]["application_response"] == {"name": "John Doe"}


def test_application_form_get_application_not_found(
    client, enable_factory_create, db_session, api_auth_token
):
    non_existent_application_id = str(uuid.uuid4())
    non_existent_app_form_id = str(uuid.uuid4())

    response = client.get(
        f"/alpha/applications/{non_existent_application_id}/application_form/{non_existent_app_form_id}",
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 404
    assert (
        f"Application with ID {non_existent_application_id} not found" in response.json["message"]
    )


def test_application_form_get_form_not_found(
    client, enable_factory_create, db_session, api_auth_token
):
    application = ApplicationFactory.create()

    non_existent_app_form_id = str(uuid.uuid4())

    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{non_existent_app_form_id}",
        headers={"X-Auth": api_auth_token},
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
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-Auth": "invalid-token"},
    )

    assert response.status_code == 401


def test_application_get_success(client, enable_factory_create, db_session, api_auth_token):
    application = ApplicationFactory.create(with_forms=True)
    application_forms = sorted(application.application_forms, key=lambda x: x.application_form_id)

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_id"] == str(application.application_id)
    assert response.json["data"]["competition_id"] == str(application.competition_id)
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
        }


def test_application_get_application_not_found(
    client, enable_factory_create, db_session, api_auth_token
):
    non_existent_application_id = str(uuid.uuid4())

    response = client.get(
        f"/alpha/applications/{non_existent_application_id}",
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 404
    assert (
        f"Application with ID {non_existent_application_id} not found" in response.json["message"]
    )


def test_application_get_unauthorized(client, enable_factory_create, db_session):
    application = ApplicationFactory.create()

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-Auth": "invalid-token"},
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    "application_response,expected_warnings",
    [
        # Valid data - no warnings
        ({"name": "John Doe", "age": 30}, []),
        # Missing required field
        ({}, [{"field": "$", "message": "'name' is a required property", "type": "required"}]),
        # Validation on age field
        (
            {"name": "bob", "age": 500},
            [
                {
                    "field": "$.age",
                    "message": "500 is greater than the maximum of 200",
                    "type": "maximum",
                }
            ],
        ),
    ],
)
def test_application_form_get_with_validation_warnings(
    client,
    enable_factory_create,
    db_session,
    api_auth_token,
    application_response,
    expected_warnings,
):
    """Test that GET application form endpoint includes schema validation warnings"""
    # Create a form with our test schema
    form = FormFactory.create(form_json_schema=SIMPLE_JSON_SCHEMA)

    # Create application with the form
    application = ApplicationFactory.create()

    CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create application form with the test response data
    application_form = ApplicationFormFactory.create(
        application=application,
        form=form,
        application_response=application_response,
    )

    # Make the GET request
    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-Auth": api_auth_token},
    )

    # Verify response
    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)
    assert response.json["data"]["application_response"] == application_response
    assert response.json["warnings"] == expected_warnings


def test_application_form_get_with_invalid_schema(
    client,
    enable_factory_create,
    db_session,
    api_auth_token,
):
    """Test behavior when form has an invalid JSON schema"""
    # Create a form with intentionally invalid schema
    form = FormFactory.create(form_json_schema={"properties": ["bad"]})

    # Create application with the form
    application = ApplicationFactory.create()

    CompetitionFormFactory.create(
        competition=application.competition,
        form=form,
    )

    # Create application form with some data
    application_form = ApplicationFormFactory.create(
        application=application,
        form=form,
        application_response={"name": "Test Name"},
    )

    # Make the GET request
    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-Auth": api_auth_token},
    )

    # Should error
    assert response.status_code == 500
