import logging
from collections.abc import Sequence
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import OrganizationAuditEvent, Privilege, RoleType
from src.constants.static_role_values import (
    GRANULAR_APPLICATION_ROLE_IDS,
    ORG_ADMIN_ID,
    ORGANIZATION_BASE_ROLE_IDS,
)
from src.db.models.competition_models import Application
from src.db.models.entity_models import Organization
from src.db.models.user_models import LinkRoleRoleType, OrganizationUserRole, Role, User
from src.services.organizations_v1.get_organization import get_organization
from src.services.organizations_v1.organization_audit import add_audit_event
from src.services.organizations_v1.organization_user_utils import (
    get_individual_application_roles,
    replace_individual_application_roles,
    validate_organization_user_exists,
)
from src.services.organizations_v1.remove_user_from_organization import is_last_admin

logger = logging.getLogger(__name__)


@dataclass
class IndividualApplicationRoles:
    application_id: UUID
    roles: list[Role]


@dataclass
class OrganizationUserRoles:
    roles: list[Role]
    individual_application_roles: list[IndividualApplicationRoles]
    is_external: bool


def validate_roles(db_session: db.Session, role_ids: set[UUID]) -> Sequence[Role]:
    """Validate provided roles and return them"""
    # TODO: In the future, extend this query to check if the role is either:
    #         - a core role (shared across all orgs), OR
    #         - owned by the organization making the request
    roles = (
        db_session.execute(
            select(Role)
            .join(LinkRoleRoleType, LinkRoleRoleType.role_id == Role.role_id)
            .where(Role.role_id.in_(role_ids))
            .where(LinkRoleRoleType.role_type == RoleType.ORGANIZATION)
            .where(Role.is_core.is_(True))
        )
        .scalars()
        .all()
    )

    if len(roles) != len(role_ids):
        missing = role_ids - {r.role_id for r in roles}
        raise_flask_error(404, message=f"Could not find the following role IDs: {missing}")

    return roles


def validate_organization_roles(role_ids: set[UUID]) -> None:
    """Validate the roles requested for the organization.

    Raises:
        FlaskError: 404 if a role can't be assigned in the organization,
            422 if there isn't exactly one base role
    """
    missing = role_ids - ORGANIZATION_BASE_ROLE_IDS - GRANULAR_APPLICATION_ROLE_IDS
    if missing:
        raise_flask_error(404, message=f"Could not find the following role IDs: {missing}")

    if len(role_ids & ORGANIZATION_BASE_ROLE_IDS) != 1:
        raise_flask_error(422, message="Exactly one base role must be provided")


def validate_individual_application_roles(
    db_session: db.Session,
    organization: Organization,
    role_ids: set[UUID],
    individual_application_roles: list[dict],
) -> dict[UUID, set[UUID]]:
    """Validate the per-application roles and return the role IDs for each application.

    Raises:
        FlaskError: 422 if the roles are invalid, 404 if an application isn't in the organization
    """
    application_roles: dict[UUID, set[UUID]] = {}
    for application_role in individual_application_roles:
        application_id = application_role["application_id"]
        if application_id in application_roles:
            raise_flask_error(
                422, message=f"Application ID {application_id} is provided more than once"
            )

        application_role_ids = set(application_role["role_ids"])
        # Only View, Modify, and Submit Applications can be granted per application
        if not application_role_ids <= GRANULAR_APPLICATION_ROLE_IDS:
            raise_flask_error(422, message="Application roles must be granular application roles")
        if application_role_ids & role_ids:
            raise_flask_error(
                422,
                message="A granular role can't be granted both organization-wide and per application",
            )

        application_roles[application_id] = application_role_ids

    found_application_ids = set(
        db_session.execute(
            select(Application.application_id)
            .where(Application.application_id.in_(application_roles.keys()))
            .where(Application.organization_id == organization.organization_id)
        )
        .scalars()
        .all()
    )
    missing = application_roles.keys() - found_application_ids
    if missing:
        raise_flask_error(404, message=f"Could not find the following application IDs: {missing}")

    return application_roles


def update_user_organization_roles(
    db_session: db.Session, user: User, target_user_id: UUID, organization_id: UUID, data: dict
) -> OrganizationUserRoles:
    """Update roles of a user in an organization, after validating permissions and membership."""
    logger.info("Attempting to update roles for user")
    # Lookup organization
    organization = get_organization(db_session, organization_id)
    # Permission checks
    check_user_access(
        db_session,
        user,
        {Privilege.MANAGE_ORG_MEMBERS},
        organization,
    )

    # Validate target user exists
    org_user = validate_organization_user_exists(db_session, target_user_id, organization)

    new_role_ids = set(data["role_ids"])
    validate_organization_roles(new_role_ids)
    new_application_roles = validate_individual_application_roles(
        db_session, organization, new_role_ids, data["individual_application_roles"]
    )

    if ORG_ADMIN_ID not in new_role_ids and is_last_admin(db_session, target_user_id, organization):
        raise_flask_error(403, message="Cannot demote the last administrator of the organization")

    existing_role_ids = {our.role_id for our in org_user.organization_user_roles}
    if existing_role_ids != new_role_ids:
        # Delete roles
        for org_role in [
            r
            for r in org_user.organization_user_roles
            if r.role_id in (existing_role_ids - new_role_ids)
        ]:
            db_session.delete(org_role)

        # Add new roles
        for role_id in new_role_ids - existing_role_ids:
            db_session.add(OrganizationUserRole(organization_user=org_user, role_id=role_id))

        # Add audit event when a user role is updated
        add_audit_event(
            db_session=db_session,
            organization=organization,
            user=user,
            audit_event=OrganizationAuditEvent.USER_UPDATED,
            target_user=org_user.user,
        )

    replace_individual_application_roles(db_session, org_user, new_application_roles)

    if data["is_external"] is not None:
        org_user.is_external = data["is_external"]

    # Push changes to database and refresh
    db_session.flush()
    db_session.refresh(org_user)

    return OrganizationUserRoles(
        roles=org_user.roles,
        individual_application_roles=[
            IndividualApplicationRoles(application_id=application_id, roles=roles)
            for application_id, roles in get_individual_application_roles(
                db_session, org_user
            ).items()
        ],
        is_external=org_user.is_external,
    )
