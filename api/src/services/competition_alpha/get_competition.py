import uuid

import grants_shared.adapters.db as db
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Competition


def get_competition(db_session: db.Session, competition_id: uuid.UUID) -> Competition:

    competition: Competition | None = db_session.execute(
        select(Competition)
        .where(Competition.competition_id == competition_id)
        # Fetch the competition forms + actual form objects in the query
        # We don't do "*" here as this endpoint doesn't need to fetch things
        # like the opportunity or applications
        .options(
            selectinload(Competition.competition_forms),
            # Grab the assistance listing object
            selectinload(Competition.opportunity_assistance_listing),
            # Grab who can apply to the application
            selectinload(Competition.link_competition_open_to_applicant),
            # Grab the competition instructions
            selectinload(Competition.competition_instructions),
        )
        .options()
    ).scalar_one_or_none()

    if competition is None:
        raise_flask_error(404, message=f"Could not find Competition with ID {competition_id}")

    return competition
