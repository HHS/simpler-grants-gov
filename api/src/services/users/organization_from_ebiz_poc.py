import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.db.models.entity_models import SamGovEntity
from src.db.models.user_models import OrganizationUser, User
from src.util.sam_gov_utils import link_sam_gov_entity_if_not_exists

logger = logging.getLogger(__name__)


def find_sam_gov_entity_for_ebiz_poc(
    db_session: db.Session, user_email: str
) -> SamGovEntity | None:
    """
    Find a SAM.gov entity where the user's email matches the ebiz POC email.

    Returns the first SAM.gov entity found or None if user is not an ebiz POC.
    """
    return (
        db_session.execute(
            select(SamGovEntity)
            .where(SamGovEntity.ebiz_poc_email == user_email)
            .options(selectinload(SamGovEntity.organization))
        )
        .scalars()
        .first()
    )


def handle_ebiz_poc_organization_during_login(
    db_session: db.Session, user: User
) -> OrganizationUser | None:
    """
    Handle organization creation and linking for new users who are ebiz POCs.
    """
    # Check if user has an email
    if not user.email:
        return None

    # Check if the user is an ebiz POC for any SAM.gov entity
    sam_gov_entity = find_sam_gov_entity_for_ebiz_poc(db_session, user.email)

    if sam_gov_entity is None:
        logger.debug(
            "User is not an ebiz POC for any SAM.gov entity",
            extra={"user_id": str(user.user_id), "user_email": user.email},
        )
        return None

    # User is an ebiz POC, link them to the organization
    logger.info(
        "User is ebiz POC, linking to organization",
        extra={
            "user_id": str(user.user_id),
            "user_email": user.email,
            "sam_gov_entity_id": str(sam_gov_entity.sam_gov_entity_id),
        },
    )

    return link_sam_gov_entity_if_not_exists(db_session, sam_gov_entity, user)
