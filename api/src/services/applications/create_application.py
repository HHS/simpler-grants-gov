import logging
import uuid
from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application, Competition

logger = logging.getLogger(__name__)


def create_application(db_session: db.Session, competition_id: UUID) -> Application:
    """
    Create a new application for a competition.
    """
    # Check if competition exists
    competition = db_session.execute(
        select(Competition).where(Competition.competition_id == competition_id)
    ).scalar_one_or_none()

    if not competition:
        raise_flask_error(404, f"Competition with ID {competition_id} not found")

    # Create a new application
    application = Application(application_id=uuid.uuid4(), competition_id=competition_id)

    db_session.add(application)
    db_session.commit()

    logger.info(
        "Created new application",
        extra={
            "application_id": str(application.application_id),
            "competition_id": str(competition_id),
        },
    )

    return application
