from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application


def get_application(db_session: db.Session, application_id: UUID) -> Application:
    # Check if application exists
    application = db_session.execute(
        select(Application)
        .options(selectinload(Application.application_forms))  # Fetch the application forms
        .where(Application.application_id == application_id)
    ).scalar_one_or_none()

    if not application:
        raise_flask_error(404, f"Application with ID {application_id} not found")

    return application
