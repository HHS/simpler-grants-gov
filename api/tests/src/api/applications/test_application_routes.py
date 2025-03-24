import uuid

import pytest
from sqlalchemy import select

from src.db.models.competition_models import Application, ApplicationForm, Competition
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    OpportunityFactory,
)


@pytest.fixture(autouse=True)
def clear_competitions(db_session):
    cascade_delete_from_db_table(db_session, ApplicationForm)
    cascade_delete_from_db_table(db_session, Competition)


def test_application_start_success(client, api_auth_token, enable_factory_create, db_session):
    """Test successful creation of an application"""

    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity_id=opportunity.opportunity_id)

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
    applications_count = db_session.execute(select(Application)).scalars().all()
    assert len(applications_count) == 0


def test_application_start_unauthorized(client, enable_factory_create, db_session):
    """Test application creation fails without proper authentication"""

    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity_id=opportunity.opportunity_id)

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-Auth": "123"}
    )

    assert response.status_code == 401

    # Verify no application was created
    applications_count = db_session.execute(select(Application)).scalars().all()
    assert len(applications_count) == 0


def test_application_start_invalid_request(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application creation fails with invalid request data"""
    request_data = {"my_field": {"a": 1, "b": [{"c": "hello"}]}}

    response = client.post(
        "/alpha/applications/start", json=request_data, headers={"X-Auth": api_auth_token}
    )

    assert response.status_code == 422  # Validation error

    # Verify no application was created
    applications_count = db_session.execute(select(Application)).scalars().all()
    assert len(applications_count) == 0


def test_application_form_update_success_create(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test successful creation of an application form response"""
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity_id=opportunity.opportunity_id)

    # Create application
    application = ApplicationFactory.create(competition=competition)

    # Create form
    form = FormFactory.create(
        form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
        form_ui_schema={"name": {"ui:widget": "text"}},
    )

    CompetitionFormFactory.create(
        competition=competition,
        form=form,
    )

    application_id = str(application.application_id)
    form_id = str(form.form_id)
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
            ApplicationForm.form_id == form.form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == {"name": "John Doe"}


def test_application_form_update_success_update(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test successful update of an existing application form response"""
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)

    # Create application
    application = ApplicationFactory.create(competition=competition)

    form = FormFactory.create(
        form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
        form_ui_schema={"name": {"ui:widget": "text"}},
    )

    existing_form = ApplicationFormFactory.create(
        application=application,
        form=form,
        application_response={"name": "Original Name"},
    )
    CompetitionFormFactory.create(
        competition=competition,
        form=form,
    )

    application_id = str(application.application_id)
    form_id = str(form.form_id)
    request_data = {"application_response": {"name": "Updated Name"}}

    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify application form was updated in the database
    db_session.refresh(existing_form)
    assert existing_form.application_response == {"name": "Updated Name"}


def test_application_form_update_application_not_found(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application form update fails when application doesn't exist"""
    # Create form
    form = FormFactory.create(
        form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
        form_ui_schema={"name": {"ui:widget": "text"}},
    )
    db_session.add(form)
    db_session.commit()

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
    application_forms = db_session.execute(select(ApplicationForm)).scalars().all()
    assert len(application_forms) == 0


def test_application_form_update_form_not_found(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application form update fails when form doesn't exist"""
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity_id=opportunity.opportunity_id)

    # Create application
    application = Application(
        application_id=uuid.uuid4(), competition_id=competition.competition_id
    )
    db_session.add(application)
    db_session.commit()

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
    application_forms = db_session.execute(select(ApplicationForm)).scalars().all()
    assert len(application_forms) == 0


def test_application_form_update_unauthorized(client, enable_factory_create, db_session):
    """Test application form update fails without proper authentication"""
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity_id=opportunity.opportunity_id)

    # Create application
    application = Application(
        application_id=uuid.uuid4(), competition_id=competition.competition_id
    )
    db_session.add(application)

    # Create form
    form = FormFactory.create(
        form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
        form_ui_schema={"name": {"ui:widget": "text"}},
    )
    db_session.add(form)
    db_session.commit()

    application_id = str(application.application_id)
    form_id = str(form.form_id)
    request_data = {"application_response": {"name": "John Doe"}}

    # Act
    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-Auth": "invalid-token"},
    )

    # Assert
    assert response.status_code == 401

    # Verify no application form was created
    application_forms = db_session.execute(select(ApplicationForm)).scalars().all()
    assert len(application_forms) == 0


def test_application_form_update_invalid_request(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application form update fails with invalid request data"""
    # Arrange
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity_id=opportunity.opportunity_id)

    # Create application
    application = Application(
        application_id=uuid.uuid4(), competition_id=competition.competition_id
    )
    db_session.add(application)

    # Create form
    form = FormFactory.create(
        form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
        form_ui_schema={"name": {"ui:widget": "text"}},
    )
    db_session.add(form)
    db_session.commit()

    application_id = str(application.application_id)
    form_id = str(form.form_id)
    request_data = {}  # Missing required application_response

    # Act
    response = client.put(
        f"/alpha/applications/{application_id}/forms/{form_id}",
        json=request_data,
        headers={"X-Auth": api_auth_token},
    )

    # Assert
    assert response.status_code == 422  # Validation error

    # Verify no application form was created
    application_forms = db_session.execute(select(ApplicationForm)).scalars().all()
    assert len(application_forms) == 0


def test_application_form_update_complex_json(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test application form update with complex JSON data"""
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)

    # Create application
    application = ApplicationFactory.create(competition=competition)

    form = FormFactory.create(
        form_json_schema={"type": "object"},
        form_ui_schema={},
    )

    application_form = ApplicationFormFactory.create(
        application_id=application.application_id,
        form_id=form.form_id,
    )

    CompetitionFormFactory.create(
        competition=competition,
        form=form,
    )

    application_id = str(application.application_id)
    form_id = str(form.form_id)
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
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application.application_id,
            ApplicationForm.form_id == form.form_id,
        )
    ).scalar_one_or_none()

    assert application_form is not None
    assert application_form.application_response == complex_json


def test_application_form_get_success(client, enable_factory_create, db_session, api_auth_token):
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)

    application = ApplicationFactory.create(competition=competition)

    form = FormFactory.create(
        form_name="Test Form",
        form_version="1.0",
        form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
        form_ui_schema={"name": {"ui:widget": "text"}},
    )

    application_form = ApplicationFormFactory.create(
        application=application,
        form=form,
        application_response={"name": "John Doe"},
    )

    CompetitionFormFactory.create(
        competition=competition,
        form=form,
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_form_id"] == str(application_form.application_form_id)
    assert response.json["data"]["application_id"] == str(application.application_id)
    assert response.json["data"]["form_id"] == str(form.form_id)
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
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)

    application = ApplicationFactory.create(competition=competition)

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
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)

    application = ApplicationFactory.create(competition=competition)

    form = FormFactory.create(
        form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
        form_ui_schema={"name": {"ui:widget": "text"}},
    )

    application_form = ApplicationFormFactory.create(
        application=application,
        form=form,
        application_response={"name": "John Doe"},
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}/application_form/{application_form.application_form_id}",
        headers={"X-Auth": "invalid-token"},
    )

    assert response.status_code == 401


def test_application_get_success(client, enable_factory_create, db_session, api_auth_token):
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)

    application = ApplicationFactory.create(competition=competition)

    form_1 = FormFactory.create(
        form_name="Test Form",
        form_version="1.0",
        form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
        form_ui_schema={"name": {"ui:widget": "text"}},
    )

    application_form_1 = ApplicationFormFactory.create(
        application=application,
        form=form_1,
        application_response={"name": "John Doe"},
    )

    CompetitionFormFactory.create(
        competition=competition,
        form=form_1,
    )

    form_2 = FormFactory.create(
        form_name="Test Form 2",
        form_version="1.0",
        form_json_schema={"type": "object", "properties": {"other": {"type": "string"}}},
        form_ui_schema={"other": {"ui:widget": "text"}},
    )

    application_form_2 = ApplicationFormFactory.create(
        application=application,
        form=form_2,
        application_response={"other": "Some Value"},
    )

    CompetitionFormFactory.create(
        competition=competition,
        form=form_2,
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"]["application_id"] == str(application.application_id)
    assert response.json["data"]["competition_id"] == str(competition.competition_id)
    assert len(response.json["data"]["application_forms"]) == 2

    assert response.json["data"]["application_forms"][0] == {
        "application_form_id": str(application_form_1.application_form_id),
        "application_id": str(application.application_id),
        "form_id": str(form_1.form_id),
        "application_response": {"name": "John Doe"},
    }
    assert response.json["data"]["application_forms"][1] == {
        "application_form_id": str(application_form_2.application_form_id),
        "application_id": str(application.application_id),
        "form_id": str(form_2.form_id),
        "application_response": {"other": "Some Value"},
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
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)

    application = ApplicationFactory.create(competition=competition)

    ApplicationFormFactory.create(
        application=application,
        form=FormFactory.create(
            form_json_schema={"type": "object", "properties": {"name": {"type": "string"}}},
            form_ui_schema={"name": {"ui:widget": "text"}},
        ),
        application_response={"name": "John Doe"},
    )

    response = client.get(
        f"/alpha/applications/{application.application_id}",
        headers={"X-Auth": "invalid-token"},
    )

    assert response.status_code == 401
