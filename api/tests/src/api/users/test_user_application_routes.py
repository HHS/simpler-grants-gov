from src.api.users.user_schemas import UserApplicationListItemSchema
from src.constants.lookup_constants import ApplicationStatus
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationUserFactory,
    CompetitionFactory,
    OpportunityFactory,
    OrganizationFactory,
    SamGovEntityFactory,
    UserFactory,
)


def test_user_get_applications_success(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test successful retrieval of applications for a user"""
    # Create an agency to have proper agency_name
    agency = AgencyFactory.create(agency_code="TEST-AC", agency_name="Test Agency")

    # Create an opportunity with the agency
    opportunity = OpportunityFactory.create(
        opportunity_title="Test Opportunity", agency_code=agency.agency_code
    )

    # Create a competition
    competition = CompetitionFactory.create(
        opportunity=opportunity,
        competition_title="Test Competition",
        opening_date=None,
        closing_date=None,
        is_simpler_grants_enabled=True,
    )

    # Create organization with SAM.gov entity
    sam_gov_entity = SamGovEntityFactory.create(legal_business_name="Test Org LLC")
    organization = OrganizationFactory.create(sam_gov_entity=sam_gov_entity)

    # Create applications
    application1 = ApplicationFactory.create(
        competition=competition,
        application_name="My First App",
        application_status=ApplicationStatus.IN_PROGRESS,
        organization=organization,
    )
    application2 = ApplicationFactory.create(
        competition=competition,
        application_name="My Second App",
        application_status=ApplicationStatus.SUBMITTED,
        organization=None,  # Individual application
    )

    # Associate user with applications
    ApplicationUserFactory.create(user=user, application=application1, is_application_owner=True)
    ApplicationUserFactory.create(user=user, application=application2, is_application_owner=True)

    # Make the request
    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert "data" in response.json

    # Check that we got both applications
    applications = response.json["data"]
    assert len(applications) == 2

    # Sort by application name for consistent testing
    applications.sort(key=lambda x: x["application_name"])

    # Verify first application
    app1_data = applications[0]
    assert app1_data["application_id"] == str(application1.application_id)
    assert app1_data["application_name"] == "My First App"
    assert app1_data["application_status"] == ApplicationStatus.IN_PROGRESS.value

    # Check organization data
    assert app1_data["organization"] is not None
    assert app1_data["organization"]["organization_id"] == str(organization.organization_id)
    assert app1_data["organization"]["sam_gov_entity"]["legal_business_name"] == "Test Org LLC"

    # Check competition data
    assert app1_data["competition"]["competition_id"] == str(competition.competition_id)
    assert app1_data["competition"]["competition_title"] == "Test Competition"
    assert app1_data["competition"]["is_open"] is True

    # Check opportunity data
    assert app1_data["competition"]["opportunity"] is not None
    assert app1_data["competition"]["opportunity"]["opportunity_id"] == str(
        opportunity.opportunity_id
    )
    assert app1_data["competition"]["opportunity"]["opportunity_title"] == "Test Opportunity"
    assert app1_data["competition"]["opportunity"]["agency_name"] == "Test Agency"

    # Verify second application (individual)
    app2_data = applications[1]
    assert app2_data["application_id"] == str(application2.application_id)
    assert app2_data["application_name"] == "My Second App"
    assert app2_data["application_status"] == ApplicationStatus.SUBMITTED.value
    assert app2_data["organization"] is None

    # Second application should also have opportunity data
    assert app2_data["competition"]["opportunity"] is not None
    assert app2_data["competition"]["opportunity"]["opportunity_title"] == "Test Opportunity"


def test_user_get_applications_empty_list(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test when user has no applications"""
    # Create a user with no applications
    user = UserFactory.create()

    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403  # User token doesn't match requested user


def test_user_get_applications_empty_for_authenticated_user(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test when authenticated user has no applications"""
    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"] == []


def test_user_get_applications_forbidden_different_user(
    client, enable_factory_create, db_session, user_auth_token
):
    """Test forbidden when requesting applications for a different user"""
    other_user = UserFactory.create()

    response = client.post(
        f"/v1/users/{other_user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert "Forbidden" in response.json["message"]


def test_user_get_applications_unauthorized(client, enable_factory_create, db_session, user):
    """Test unauthorized when no auth token provided"""
    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": "invalid-token"},
    )

    assert response.status_code == 401


def test_user_get_applications_multiple_competitions(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test user with applications across multiple competitions"""
    # Create multiple competitions
    competition1 = CompetitionFactory.create(
        competition_title="Competition One", is_simpler_grants_enabled=True
    )
    competition2 = CompetitionFactory.create(
        competition_title="Competition Two", is_simpler_grants_enabled=False
    )

    # Create applications for different competitions
    application1 = ApplicationFactory.create(
        competition=competition1,
        application_name="App for Competition 1",
        application_status=ApplicationStatus.IN_PROGRESS,
    )
    application2 = ApplicationFactory.create(
        competition=competition2,
        application_name="App for Competition 2",
        application_status=ApplicationStatus.SUBMITTED,
    )

    # Associate user with applications
    ApplicationUserFactory.create(user=user, application=application1)
    ApplicationUserFactory.create(user=user, application=application2)

    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    applications = response.json["data"]
    assert len(applications) == 2

    # Check that we have applications from both competitions
    competition_titles = {app["competition"]["competition_title"] for app in applications}
    assert "Competition One" in competition_titles
    assert "Competition Two" in competition_titles

    # Check is_open values
    comp1_app = next(
        app for app in applications if app["competition"]["competition_title"] == "Competition One"
    )
    comp2_app = next(
        app for app in applications if app["competition"]["competition_title"] == "Competition Two"
    )

    assert comp1_app["competition"]["is_open"] is True  # is_simpler_grants_enabled=True
    assert comp2_app["competition"]["is_open"] is False  # is_simpler_grants_enabled=False


def test_user_application_list_item_schema():
    """Test that the schema can be instantiated and validated"""
    schema = UserApplicationListItemSchema()

    # Test data that matches the expected schema
    test_data = {
        "application_id": "123e4567-e89b-12d3-a456-426614174000",
        "application_name": "Test Application",
        "application_status": "in_progress",
        "organization": None,
        "competition": {
            "competition_id": "123e4567-e89b-12d3-a456-426614174001",
            "competition_title": "Test Competition",
            "opening_date": None,
            "closing_date": None,
            "is_open": True,
            "opportunity": {
                "opportunity_id": "123e4567-e89b-12d3-a456-426614174002",
                "opportunity_title": "Test Opportunity",
                "agency_name": "Test Agency",
            },
        },
    }

    # This should not raise any validation errors
    result = schema.load(test_data)
    assert result["application_name"] == "Test Application"
    assert result["competition"]["competition_title"] == "Test Competition"
    assert result["competition"]["opportunity"]["opportunity_title"] == "Test Opportunity"
    assert result["competition"]["opportunity"]["agency_name"] == "Test Agency"
