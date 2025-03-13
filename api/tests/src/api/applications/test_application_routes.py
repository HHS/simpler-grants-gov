import uuid
from unittest.mock import patch

import pytest
from sqlalchemy import select

from src.db.models.competition_models import Application
from tests.src.db.models.factories import CompetitionFactory, OpportunityFactory


def test_application_start_success(client, api_auth_token, enable_factory_create, db_session):
    """Test successful creation of an application"""

    opportunity = OpportunityFactory.create_batch(3)
    competition = CompetitionFactory.create(opportunity_id=opportunity[0].opportunity_id)

    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post(
        "/v1/applications/start", json=request_data, headers={"X-Auth": api_auth_token}
    )

    # Assert
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


def test_application_start_competition_not_found(client, enable_factory_create, db_session, api_auth_token):
    """Test application creation fails when competition doesn't exist"""
    non_existent_competition_id = str(uuid.uuid4())
    request_data = {"competition_id": non_existent_competition_id}

    response = client.post(
        "/v1/applications/start", json=request_data, headers={"X-Auth": api_auth_token}
    )

    # Assert
    assert response.status_code == 404
    assert (
        f"Competition with ID {non_existent_competition_id} not found" in response.json["message"]
    )

    # Verify no application was created
    applications_count = db_session.execute(select(Application)).scalars().all()
    assert len(applications_count) == 0


def test_application_start_unauthorized(client, enable_factory_create, db_session, competition):
    """Test application creation fails without proper authentication"""
    # Arrange
    competition_id = str(competition.competition_id)
    request_data = {"competition_id": competition_id}

    response = client.post("/v1/applications/start", json=request_data)

    # Assert
    assert response.status_code == 401

    # Verify no application was created
    applications_count = db_session.execute(select(Application)).scalars().all()
    assert len(applications_count) == 0


def test_application_start_invalid_request(client, enable_factory_create, db_session, api_auth_token):
    """Test application creation fails with invalid request data"""
    # Arrange
    request_data = {}  # Missing required competition_id

    response = client.post(
        "/v1/applications/start", json=request_data, headers={"X-Auth": api_auth_token}
    )

    # Assert
    assert response.status_code == 422  # Validation error

    # Verify no application was created
    applications_count = db_session.execute(select(Application)).scalars().all()
    assert len(applications_count) == 0
