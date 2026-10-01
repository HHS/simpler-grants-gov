import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.db.models.entity_models import SamGovEntity
from src.db.models.user_models import OrganizationUser, User
from src.util.sam_gov_utils import link_sam_gov_entity_if_not_exists

logger = logging.getLogger(__name__)


def find_sam_gov_entities_for_ebiz_poc(
    db_session: db.Session, user_email: str
) -> list[SamGovEntity]:
    """
    Find SAM.gov entities where the user's email matches the ebiz POC email.

    Returns a list of SAM.gov entities or empty list if user is not an ebiz POC.
    """
    return list(
        db_session.execute(
            select(SamGovEntity)
            .where(SamGovEntity.ebiz_poc_email == user_email)
            .options(selectinload(SamGovEntity.organization))
        )
        .scalars()
        .all()
    )


def handle_ebiz_poc_organization_during_login(
    db_session: db.Session, user: User
) -> list[OrganizationUser] | None:
    """
    Handle organization creation and linking for new users who are ebiz POCs.
    """
    # Check if user has an email
    if not user.email:
        return None

    # Check if the user is an ebiz POC for any SAM.gov entities
    sam_gov_entities = find_sam_gov_entities_for_ebiz_poc(db_session, user.email)

    if not sam_gov_entities:
        return None

    # User is an ebiz POC, link them to all their organizations
    organization_users = []
    for sam_gov_entity in sam_gov_entities:
        org_user = link_sam_gov_entity_if_not_exists(db_session, sam_gov_entity, user)
        organization_users.append(org_user)

    return organization_users
