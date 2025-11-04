import logging
import uuid
from typing import Callable

import src.adapters.db as db
from src.constants.static_role_values import ORG_ADMIN
from src.db.models.entity_models import Organization, SamGovEntity
from src.db.models.user_models import OrganizationUser, OrganizationUserRole, User

logger = logging.getLogger(__name__)


# Define a function that does nothing
def no_op(metric_name: str) -> None:
    pass


def link_sam_gov_entity_if_not_exists(
    db_session: db.Session,
    sam_gov_entity: SamGovEntity,
    user: User,
    increment_metric: Callable[[str], None] | None = None,
) -> OrganizationUser:
    """Link a sam.gov entity record to the EBIZ POC (owner) through an organization record

    This will potentially do the following:
    * Create the organization if it does not exist
    * Add the user to the organization if they aren't already
    * Mark that UserOrganization record as the owner of the organization

    Each of these steps is done independently, which means the following:
    * If the EBIZ POC email changes on the sam.gov entity record, a new owner will be added
    * If that owner was already in the org, they just get a new permission
    * Any existing owner will NOT be removed
    * If the organization, and owner are already setup, this will do nothing

    Args:
        db_session: Database session
        sam_gov_entity: The SAM.gov entity to link
        user: The user to link as organization owner
        increment_metric: Optional callback to increment metrics (used by tasks)

    Returns:
        The OrganizationUser record that was created or updated
    """
    # Set the metric function to no-op if None
    if increment_metric is None:
        increment_metric = no_op

    log_extra = {"sam_gov_entity_id": sam_gov_entity.sam_gov_entity_id, "user_id": user.user_id}
    logger.info("Processing sam.gov entity record connection to user", extra=log_extra)

    # If an organization does not already exist for the sam.gov entity
    # create and associate it
    organization = sam_gov_entity.organization
    if organization is None:
        increment_metric("new_organization_created_count")
        organization = Organization(organization_id=uuid.uuid4(), sam_gov_entity=sam_gov_entity)
        db_session.add(organization)

        log_extra["organization_id"] = organization.organization_id
        logger.info("Created new organization attached to sam.gov entity", extra=log_extra)
    else:
        log_extra["organization_id"] = organization.organization_id

    # If the user is not already a member of the organization, add them
    organization_user = None
    for org_user in user.organization_users:
        if org_user.organization_id == organization.organization_id:
            organization_user = org_user
            break

    if organization_user is None:
        increment_metric("new_organization_user_created_count")
        organization_user = OrganizationUser(organization=organization, user=user)
        db_session.add(organization_user)
        logger.info("Added user to organization", extra=log_extra)

    # Ensure the organization user has the Organization Admin role
    _assign_organization_admin_role(db_session, organization_user, log_extra, increment_metric)

    return organization_user


def _assign_organization_admin_role(
    db_session: db.Session,
    organization_user: OrganizationUser,
    log_extra: dict,
    increment_metric: Callable[[str], None],
) -> None:
    """Assign the Organization Admin role to an organization user if they don't already have it."""

    # Check if the user already has the Organization Admin role
    for role_assignment in organization_user.organization_user_roles:
        if role_assignment.role_id == ORG_ADMIN.role_id:
            # User already has the role, nothing to do
            return

    # User doesn't have the role, assign it
    increment_metric("new_organization_admin_role_assigned_count")
    org_user_role = OrganizationUserRole(
        organization_user=organization_user, role_id=ORG_ADMIN.role_id
    )
    db_session.add(org_user_role)
    logger.info("Assigned Organization Admin role to organization user", extra=log_extra)
