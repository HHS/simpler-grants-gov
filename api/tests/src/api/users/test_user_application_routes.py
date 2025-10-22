import pytest

from src.api.users.user_schemas import UserApplicationListItemSchema
from src.constants.lookup_constants import ApplicationStatus, Privilege
from tests.lib.application_list_utils import create_user_in_app
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    CompetitionFactory,
    OpportunityFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    SamGovEntityFactory,
    UserFactory,
)


@pytest.fixture
def app_a():
    return ApplicationFactory.create()


@pytest.fixture
def app_b():
    return ApplicationFactory.create()


@pytest.fixture
def org_a():
    return OrganizationFactory.create()


@pytest.fixture
def org_b():
    return OrganizationFactory.create()


@pytest.fixture
def apps_owned_org_a(org_a):
    return ApplicationFactory.create_batch(2, organization=org_a)


@pytest.fixture
def app_owned_org_b(org_b):
    return ApplicationFactory.create(organization=org_b)


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
    ApplicationUserFactory.create(user=user, application=application1, as_owner=True)
    ApplicationUserFactory.create(user=user, application=application2, as_owner=True)

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
    ApplicationUserFactory.create(user=user, application=application1, as_owner=True)
    ApplicationUserFactory.create(user=user, application=application2, as_owner=True)

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


@pytest.mark.parametrize(
    "privileges,apps_count",
    [
        ([Privilege.VIEW_APPLICATION], 1),  # Correct Privilege
        ([Privilege.LIST_APPLICATION], 0),  # Wrong Privilege
        ([Privilege.VIEW_APPLICATION, Privilege.LIST_APPLICATION], 1),  # Mixed Privilege
        (None, 0),  # No role
    ],
)
def test_user_application_list_access(
    client, enable_factory_create, db_session, privileges, app_a, apps_count
):
    """
    Test that a user can only see applications they have VIEW_APPLICATION privilege for.
    """
    user, application, token = create_user_in_app(
        db_session, application=app_a, privileges=privileges
    )

    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Validate the returned applications count
    applications = response.json["data"]
    assert len(applications) == apps_count
    # If privileges included VIEW, returned application should be app_a
    if apps_count > 0:
        assert applications[0]["application_id"] == str(app_a.application_id)


def test_user_application_list_access_multi_applications(
    client, enable_factory_create, db_session, app_a, app_b
):
    """
    Test that when a user has multiple applications,only those with VIEW_APPLICATION privilege are returned
    """
    # Create user with VIEW privilege on app_a
    user, application, token = create_user_in_app(
        db_session, application=app_a, privileges=[Privilege.VIEW_APPLICATION]
    )
    # Give the same user LIST privilege on a different application (app_b)
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=app_b),
        role=RoleFactory.create(privileges=[Privilege.LIST_APPLICATION]),
    )
    # create an application-user link with no roles/privileges
    ApplicationUserFactory.create(user=user)

    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # assert only application with correct privilege is returned
    applications = response.json["data"]
    assert len(applications) == 1
    assert applications[0]["application_id"] == str(app_a.application_id)


@pytest.mark.parametrize(
    "privileges,apps_count",
    [
        ([Privilege.VIEW_APPLICATION], 1),  # Correct Privilege
        ([Privilege.LIST_APPLICATION], 0),  # Wrong Privilege
        ([Privilege.VIEW_APPLICATION, Privilege.LIST_APPLICATION], 1),  # Mixed Privilege
        (None, 0),  # No role
    ],
)
def test_user_application_list_access_org(
    client, enable_factory_create, db_session, privileges, org_b, app_owned_org_b, apps_count
):
    """
    Test that a user can only see applications they have VIEW_APPLICATION privilege for through their organization role.
    """
    user, organization, token = create_user_in_org(
        db_session, organization=org_b, privileges=privileges
    )

    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Validate the returned applications count
    applications = response.json["data"]
    assert len(applications) == apps_count
    # If privileges included VIEW, returned application should be app_a
    if apps_count > 0:
        assert applications[0]["application_id"] == str(app_owned_org_b.application_id)


def test_user_application_list_access_multi_applications_orgs(
    client, enable_factory_create, db_session, org_a, org_b, apps_owned_org_a, app_owned_org_b
):
    """
    Test that when a user has multiple applications,only those with VIEW_APPLICATION privilege are returned
    """
    # Create user with VIEW privilege on org_a
    user, organization, token = create_user_in_org(
        db_session, organization=org_a, privileges=[Privilege.VIEW_APPLICATION]
    )

    # Give the same user LIST privilege on a different organization (org_b)
    OrganizationUserRoleFactory(
        organization_user=OrganizationUserFactory.create(user=user, organization=org_b),
        role=RoleFactory.create(privileges=[Privilege.LIST_APPLICATION]),
    )

    # create an organization-user link with no roles/privileges
    org_user = OrganizationUserFactory.create(user=user)
    ApplicationFactory.create(organization=org_user.organization)

    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # assert only applications with correct privilege is returned
    applications = response.json["data"]
    assert len(applications) == 2
    assert set(app["application_id"] for app in applications) == set(
        str(app.application_id) for app in apps_owned_org_a
    )


def test_user_application_list_access_org_and_app_privilege_no_duplication(
    client, enable_factory_create, db_session, app_owned_org_b, org_b, user
):
    """Test that if a user has both APP-LEVEL and ORG-LEVEL VIEW_APPLICATION privileges
    for the same application (same org), the application is only returned once."""

    user, organization, token = create_user_in_org(
        db_session, organization=org_b, privileges=[Privilege.VIEW_APPLICATION]
    )
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=app_owned_org_b),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # return the application once
    applications = response.json["data"]
    assert len(applications) == 1
    assert applications[0]["application_id"] == str(app_owned_org_b.application_id)


def test_user_application_list_access_org_and_app_privilege(
    client, enable_factory_create, db_session, org_a, org_b, app_owned_org_b, apps_owned_org_a, user
):
    """Test that if a user has:
    - ORG-LEVEL VIEW privilege on Org A (covering multiple apps)
    - APP-LEVEL VIEW privilege on a specific app in Org B"""

    # Create user and give APP-LEVEL VIEW on app_org_b
    user, _, token = create_user_in_app(
        db_session, application=app_owned_org_b, privileges=[Privilege.VIEW_APPLICATION]
    )
    # Give ORG-LEVEL VIEW on org_a
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=org_a),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    response = client.post(
        f"/v1/users/{user.user_id}/applications",
        json={},
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify all apps are returned, no duplicates
    applications = response.json["data"]
    assert len(applications) == 3
    assert set(app["application_id"] for app in applications) == set(
        str(app.application_id) for app in apps_owned_org_a + [app_owned_org_b]
    )
