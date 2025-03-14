import uuid

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Competition


def get_competition(db_session: db.Session, competition_id: uuid.UUID) -> Competition:

    # TODO - add eager load
    competition: Competition | None = db_session.execute(
        select(Competition).where(Competition.competition_id == competition_id)
    ).scalar_one_or_none()

    if competition is None:
        raise_flask_error(404, message=f"Could not find Competition with ID {competition_id}")

    return competition
