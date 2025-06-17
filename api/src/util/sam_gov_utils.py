import logging
import uuid
from typing import Callable

import src.adapters.db as db
from src.db.models.entity_models import Organization, SamGovEntity
from src.db.models.user_models import OrganizationUser, User

logger = logging.getLogger(__name__)


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
    log_extra = {"sam_gov_entity_id": sam_gov_entity.sam_gov_entity_id, "user_id": user.user_id}
    logger.info("Processing sam.gov entity record connection to user", extra=log_extra)

    # If an organization does not already exist for the sam.gov entity
    # create and associate it
    organization = sam_gov_entity.organization
    if organization is None:
        if increment_metric:
            increment_metric("new_organization_created_count")
        organization = Organization(organization_id=uuid.uuid4(), sam_gov_entity=sam_gov_entity)
        db_session.add(organization)

        log_extra["organization_id"] = organization.organization_id
        logger.info("Created new organization attached to sam.gov entity", extra=log_extra)
    else:
        log_extra["organization_id"] = organization.organization_id

    # If the user is not already a member of the organization, add them
    organization_user = None
    for org_user in user.organizations:  # TODO - use filter or something
        if org_user.organization_id == organization.organization_id:
            organization_user = org_user
            break

    if organization_user is None:
        if increment_metric:
            increment_metric("new_organization_user_created_count")
        organization_user = OrganizationUser(organization=organization, user=user)
        db_session.add(organization_user)
        logger.info("Added user to organization", extra=log_extra)

    # As we know they're the ebiz POC from the initial query,
    # make them the owner if they aren't already
    if organization_user.is_organization_owner is not True:
        if increment_metric:
            increment_metric("new_organization_owner_count")
        organization_user.is_organization_owner = True
        logger.info("Made user an owner of the organization", extra=log_extra)

    return organization_user
