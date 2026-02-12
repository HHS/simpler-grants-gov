import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.db.models.user_models import AgencyUser

logger = logging.getLogger(__name__)


def get_user_agencies(db_session: db.Session, user_id: UUID) -> list[dict[str, Any]]:
    """Get user agencies in the format expected by the API response."""
    agency_users = _fetch_user_agencies(db_session, user_id)

    agencies = []
    for agency_user in agency_users:
        agency = agency_user.agency

        agency_data: dict[str, Any] = {
            "agency_id": str(agency.agency_id),
            "agency_name": agency.agency_name,
            "agency_code": agency.agency_code,
        }

        agencies.append(agency_data)

    return agencies


def _fetch_user_agencies(db_session: db.Session, user_id: UUID) -> list[AgencyUser]:
    """Fetch all agencies for a user."""
    stmt = (
        select(AgencyUser)
        .where(AgencyUser.user_id == user_id)
        .options(selectinload(AgencyUser.agency))
    )

    agency_users = db_session.execute(stmt).scalars().all()
    return list(agency_users)
