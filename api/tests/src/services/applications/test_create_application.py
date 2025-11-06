from src.constants.static_role_values import APPLICATION_OWNER
from src.db.models.user_models import ApplicationUserRole
from src.services.applications.create_application import create_application
from tests.src.db.models.factories import CompetitionFactory, UserFactory


def test_create_application_assigns_owner_role_individual_application(
    db_session, enable_factory_create
):
    """Test that creating an application assigns the Application Owner role if individual application"""
    user = UserFactory.create()
    competition = CompetitionFactory.create()

    # Create application
    application = create_application(
        db_session=db_session,
        competition_id=competition.competition_id,
        user=user,
        application_name="Test Application",
    )

    # Verify ApplicationUser was created with owner flag
    application_user = (
        db_session.query(application.application_users[0].__class__)
        .filter_by(application_id=application.application_id, user_id=user.user_id)
        .first()
    )

    assert application_user is not None

    # Verify Application Owner role was assigned
    role_assignment = (
        db_session.query(ApplicationUserRole)
        .filter_by(
            application_user_id=application_user.application_user_id,
            role_id=APPLICATION_OWNER.role_id,
        )
        .first()
    )

    assert role_assignment is not None
    assert role_assignment.role_id == APPLICATION_OWNER.role_id
