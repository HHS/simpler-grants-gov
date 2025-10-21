from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import Privilege
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    LinkExternalUserFactory,
    RoleFactory,
    UserFactory,
)


def create_user_in_app(
    db_session,
    application=None,
    status=None,
    organization=None,
    competition=None,
    role=None,
    privileges: list[Privilege] = None,
    **kwargs
) -> tuple:
    """
    Create a user and associates them with an application, optionally creating related roles and privileges.

    This function is primarily used for test setup or seeding purposes.

    Args:
        db_session: Database session for creating JWT token.
        application (Application, optional): Existing application to link the user to. If None, one will be created.
        status (ApplicationStatus, optional): Status to assign if a new application is created.
        organization (Organization, optional): Organization to associate with a new application.
        competition (Competition, optional): Competition to associate with a new application.
        role (Role, optional): Predefined role to assign to the user. Ignored if privileges are provided.
        privileges (list[Privilege], optional): List of privileges to assign via a new role. Overrides `role` if provided.
        **kwargs:  Additional arguments passed to factory creation.

    Returns:
        tuple: (user, application, token) - The created user, application, and JWT token
    """

    # Create user with external login
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user)

    # Create application if not provided
    if application is None:
        app_kwargs = {}
        if status is not None:
            app_kwargs["application_status"] = status
        if organization is not None:
            app_kwargs["organization"] = organization
        if competition is not None:
            app_kwargs["competition"] = competition

        application = ApplicationFactory.create(**app_kwargs)

    # Create role with specified privileges (only if privileges provided)
    if privileges:
        role = RoleFactory.create(privileges=privileges, is_application_role=True)

    # Create application-user relationship
    app_user = ApplicationUserFactory.create(user=user, application=application)

    # Assign role to application-user if either a role or privileges were provided
    if privileges or role:
        ApplicationUserRoleFactory.create(application_user=app_user, role=role)

    # Create JWT token
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    return user, application, token
