import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import IgnoredLegacyOrganizationUser
from src.db.models.user_models import User
from src.services.organizations_v1.get_organization import get_organization

logger = logging.getLogger(__name__)


def ignore_legacy_user_organization(
    db_session: db.Session, user: User, organization_id: UUID, json_data: dict
) -> None:
    # Retrieve organization (raises 404 if not found)
    organization = get_organization(db_session, organization_id)

    # Enforce privilege check
    check_user_access(
        db_session,
        user,
        {Privilege.MANAGE_ORG_MEMBERS},
        organization,
    )

    # Normalize email
    email = json_data["email"].strip().lower()

    # Check if the user is already ignored for the organization
    existing_record = db_session.execute(
        select(IgnoredLegacyOrganizationUser).where(
            IgnoredLegacyOrganizationUser.organization_id == organization_id,
            IgnoredLegacyOrganizationUser.email == email,
        )
    ).scalar_one_or_none()
    if existing_record:
        logger.info(
            "User is already ignored",
            extra={
                "organization_id": organization_id,
                "ignored_by_user_id": user.user_id,
            },
        )
        raise_flask_error(
            400, f"User with email {email} is already ignored for organization {organization_id}"
        )

    # Add record to database if not existing
    ignored_user = IgnoredLegacyOrganizationUser(
        organization_id=organization_id, email=email, ignored_by_user_id=user.user_id
    )
    db_session.add(ignored_user)

    logger.info(
        "Legacy user is ignored for the organization",
        extra={"organization_id": organization_id, "ignored_by_user_id": user.user_id},
    )
