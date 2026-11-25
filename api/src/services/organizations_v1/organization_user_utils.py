"""Shared utilities for organization user operations."""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.constants.static_role_values import GRANULAR_APPLICATION_ROLE_IDS
from src.db.models.competition_models import Application
from src.db.models.entity_models import Organization
from src.db.models.user_models import ApplicationUser, ApplicationUserRole, OrganizationUser, Role


def validate_organization_user_exists(
    db_session: db.Session, user_id: UUID, organization: Organization
) -> OrganizationUser:
    """Validate that the user is a member of the specified organization.

    Args:
        db_session: Database session
        user_id: ID of user to validate
        organization: Organization to check membership in

    Returns:
        OrganizationUser: The organization user record

    Raises:
        FlaskError: 404 if user is not a member of the organization
    """
    org_user = db_session.execute(
        select(OrganizationUser)
        .where(OrganizationUser.organization_id == organization.organization_id)
        .where(OrganizationUser.user_id == user_id)
    ).scalar_one_or_none()

    if not org_user:
        raise_flask_error(404, message=f"Could not find User with ID {user_id}")

    return org_user


def get_organization_application_users(
    db_session: db.Session, org_user: OrganizationUser
) -> Sequence[ApplicationUser]:
    """Get the user's application records for applications owned by the organization."""
    return (
        db_session.execute(
            select(ApplicationUser)
            .join(Application, ApplicationUser.application_id == Application.application_id)
            .where(ApplicationUser.user_id == org_user.user_id)
            .where(Application.organization_id == org_user.organization_id)
        )
        .scalars()
        .all()
    )


def get_individual_application_roles(
    db_session: db.Session, org_user: OrganizationUser
) -> dict[UUID, list[Role]]:
    """Get the user's granular roles for each application owned by the organization."""
    application_roles = {}
    for app_user in get_organization_application_users(db_session, org_user):
        roles = [role for role in app_user.roles if role.role_id in GRANULAR_APPLICATION_ROLE_IDS]
        if roles:
            application_roles[app_user.application_id] = roles

    return application_roles


def replace_individual_application_roles(
    db_session: db.Session,
    org_user: OrganizationUser,
    application_roles: dict[UUID, set[UUID]],
) -> None:
    """Replace the user's granular roles on the organization's applications.

    Only granular application roles are changed, and an application record
    left without any roles is deleted.
    """
    app_users = {
        app_user.application_id: app_user
        for app_user in get_organization_application_users(db_session, org_user)
    }

    for application_id in app_users.keys() | application_roles.keys():
        new_role_ids = application_roles.get(application_id, set())

        app_user = app_users.get(application_id)
        if app_user is None:
            app_user = ApplicationUser(application_id=application_id, user_id=org_user.user_id)
            db_session.add(app_user)

        for app_user_role in list(app_user.application_user_roles):
            if (
                app_user_role.role_id in GRANULAR_APPLICATION_ROLE_IDS
                and app_user_role.role_id not in new_role_ids
            ):
                app_user.application_user_roles.remove(app_user_role)

        existing_role_ids = {
            app_user_role.role_id for app_user_role in app_user.application_user_roles
        }
        for role_id in new_role_ids - existing_role_ids:
            app_user.application_user_roles.append(ApplicationUserRole(role_id=role_id))

        if not app_user.application_user_roles:
            db_session.delete(app_user)
