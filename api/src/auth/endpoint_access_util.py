import logging
from typing import Any

from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Application
from src.db.models.entity_models import Organization
from src.db.models.user_models import Role, User

logger = logging.getLogger(__name__)


def get_roles_for_agency(user: User, agency: Agency) -> list[Role]:
    for user_agency in user.agency_users:
        if user_agency.agency_id == agency.agency_id:
            return user_agency.roles

    return []


def get_roles_for_org(user: User, organization: Organization) -> list[Role]:
    for user_organization in user.organization_users:
        if user_organization.organization_id == organization.organization_id:
            return user_organization.roles

    return []


def get_roles_for_app(user: User, application: Application) -> list[Role]:
    roles = []
    # If the app has an org, add any org roles for the user
    if application.organization is not None:
        roles.extend(get_roles_for_org(user, application.organization))

    for application_user in application.application_users:
        if application_user.user_id == user.user_id:
            roles.extend(application_user.roles)

    return roles


def get_roles_for_resource(
    user: User, resource: Organization | Application | Agency | None
) -> list[Role]:
    roles = []

    # Add any internal roles
    roles.extend(user.internal_roles)

    # As we add types of resources, just need to add here
    if isinstance(resource, Organization):
        roles.extend(get_roles_for_org(user, resource))
    elif isinstance(resource, Application):
        roles.extend(get_roles_for_app(user, resource))
    elif isinstance(resource, Agency):
        roles.extend(get_roles_for_agency(user, resource))

    return roles


def can_access(
    user: User,
    allowed_privileges: set[Privilege],
    resource: Organization | Application | Agency | None,
) -> bool:
    roles = get_roles_for_resource(user, resource)

    for role in roles:
        privilege_overlap = allowed_privileges.intersection(role.privileges)
        if len(privilege_overlap) > 0:
            logger.info(
                "Access granted",
                extra={
                    "user_id": user.user_id,
                    "role_id": role.role_id,
                    **get_log_info_for_resource(resource),
                },
            )
            return True

    logger.info(
        "Access denied", extra={"user_id": user.user_id, **get_log_info_for_resource(resource)}
    )

    return False


def verify_access(
    user: User,
    allowed_privileges: set[Privilege],
    resource: Organization | Application | Agency | None,
) -> None:
    """Wrapper function that handles erroring if a user can't access a resource"""
    if not can_access(user, allowed_privileges, resource):
        raise_flask_error(403, "Forbidden")


def get_log_info_for_resource(resource: Organization | Application | Agency | None) -> dict:
    log_info: dict[str, Any] = {}
    if resource is None:
        return log_info

    if isinstance(resource, Organization):
        log_info["resource_type"] = "organization"
        log_info["organization_id"] = resource.organization_id
    elif isinstance(resource, Application):
        log_info["resource_type"] = "application"
        log_info["application_id"] = resource.application_id
    elif isinstance(resource, Agency):
        log_info["resource_type"] = "agency"
        log_info["agency_id"] = resource.agency_id
        log_info["agency_code"] = resource.agency_code

    return log_info
