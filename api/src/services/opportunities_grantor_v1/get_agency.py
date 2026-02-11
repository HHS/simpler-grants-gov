import uuid

from sqlalchemy import select
from sqlalchemy.orm import lazyload, selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity

def get_agency(db_session: db.Session, agency_id: uuid.UUID) -> Agency:
    stmt = select(Agency).where(Agency.agency_id == agency_id)
    agency = db_session.execute(stmt).scalar_one_or_none()

    if agency is None:
        raise_flask_error(404, message=f"Could not find Agency with ID {agency_id}")

    return agency