from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import Application
from src.db.models.user_models import User
from src.services.organizations_v1.get_organization import get_organization_and_verify_access


def get_organization_applications_and_verify_access(
    db_session: db.Session, user: User, organization_id: UUID
) -> Sequence[Application]:
    """Verifies that the user has access to the specified organization,
    then returns the applications associated with that organization."""
    get_organization_and_verify_access(
        db_session, user, organization_id, privileges={Privilege.VIEW_APPLICATION}
    )
    return get_organization_applications(db_session, organization_id)


def get_organization_applications(
    db_session: db.Session, organization_id: UUID
) -> Sequence[Application]:
    """Returns the organization's applications."""
    stmt = (
        select(Application)
        .where(Application.organization_id == organization_id)
        .order_by(Application.created_at.desc())
        .options(selectinload(Application.competition))
    )

    return db_session.execute(stmt).scalars().all()
