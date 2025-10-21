from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.services.users.get_user_applications import get_user_applications
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    CompetitionFactory,
    OrganizationFactory,
    RoleFactory,
    SamGovEntityFactory,
    UserFactory,
)


def test_get_user_applications_success(enable_factory_create, db_session, user):
    """Test successfully retrieving applications for a user"""
    competition = CompetitionFactory.create(competition_title="Test Competition")

    # Create applications
    application1 = ApplicationFactory.create(
        competition=competition,
        application_name="App 1",
        application_status=ApplicationStatus.IN_PROGRESS,
    )
    application2 = ApplicationFactory.create(
        competition=competition,
        application_name="App 2",
        application_status=ApplicationStatus.SUBMITTED,
    )

    # Associate user with applications
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application1),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application2),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Call the service
    applications = get_user_applications(db_session, user.user_id)

    # Verify results
    assert len(applications) == 2
    application_ids = {str(app.application_id) for app in applications}
    assert str(application1.application_id) in application_ids
    assert str(application2.application_id) in application_ids


def test_get_user_applications_empty(enable_factory_create, db_session):
    """Test retrieving applications for a user with no applications"""
    user = UserFactory.create()

    # Call the service
    applications = get_user_applications(db_session, user.user_id)

    # Should return empty list
    assert len(applications) == 0


def test_get_user_applications_with_organization(enable_factory_create, db_session, user):
    """Test retrieving applications that have organizations"""

    # Create organization with SAM.gov entity
    sam_gov_entity = SamGovEntityFactory.create(legal_business_name="Test Organization")
    organization = OrganizationFactory.create(sam_gov_entity=sam_gov_entity)

    competition = CompetitionFactory.create()
    application = ApplicationFactory.create(
        competition=competition,
        organization=organization,
        application_name="Org Application",
    )

    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )
    # Call the service
    applications = get_user_applications(db_session, user.user_id)

    # Verify results
    assert len(applications) == 1
    app = applications[0]
    assert app.organization is not None
    assert app.organization.sam_gov_entity.legal_business_name == "Test Organization"


def test_get_user_applications_multiple_users(enable_factory_create, db_session):
    """Test that we only get applications for the specified user"""
    user1 = UserFactory.create()
    user2 = UserFactory.create()

    competition = CompetitionFactory.create()

    # Create applications for different users
    application1 = ApplicationFactory.create(competition=competition, application_name="User 1 App")
    application2 = ApplicationFactory.create(competition=competition, application_name="User 2 App")

    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user1, application=application1),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )
    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user2, application=application2),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    # Call the service for user1
    applications = get_user_applications(db_session, user1.user_id)

    # Should only get user1's application
    assert len(applications) == 1
    assert applications[0].application_name == "User 1 App"


def test_get_user_applications_preloads_relationships(enable_factory_create, db_session):
    """Test that the service properly preloads competition and organization relationships"""
    user = UserFactory.create()

    # Create organization with SAM.gov entity
    sam_gov_entity = SamGovEntityFactory.create()
    organization = OrganizationFactory.create(sam_gov_entity=sam_gov_entity)

    competition = CompetitionFactory.create(competition_title="Test Competition")
    application = ApplicationFactory.create(
        competition=competition,
        organization=organization,
    )

    ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )
    # Call the service
    applications = get_user_applications(db_session, user.user_id)

    # Verify relationships are loaded (should not trigger additional queries)
    app = applications[0]

    # Competition should be loaded
    assert app.competition.competition_title == "Test Competition"

    # Organization and its SAM.gov entity should be loaded
    assert app.organization is not None
    assert app.organization.sam_gov_entity is not None
