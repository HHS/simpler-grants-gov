import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import AgencyUser, ApplicationUser, OrganizationUser, User

logger = logging.getLogger(__name__)


def get_roles_and_privileges(
    db_session: db.Session,
    user_id: UUID,
) -> User | None:
    stmt = (
        select(User)
        .where(User.user_id == user_id)
        .options(
            # Organization-related relationships
            selectinload(User.organization_users).selectinload(OrganizationUser.organization),
            # Application-related relationships
            selectinload(User.application_users).selectinload(ApplicationUser.application),
            # Agency-related relationships
            selectinload(User.agency_users).selectinload(AgencyUser.agency),
            # Internal roles
            selectinload(User.internal_user_roles),
        )
    )
    user = db_session.execute(stmt).scalar_one_or_none()
    if not user:
        raise_flask_error(404, "User not found")

    return user
