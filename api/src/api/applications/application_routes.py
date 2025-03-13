import logging
import uuid

from sqlalchemy import select
import src.adapters.db as db
from src.adapters.db import flask_db
from src.api import response
from src.api.applications.application_blueprint import application_blueprint
from src.api.applications.application_schemas import (
    ApplicationStartRequestSchema,
    ApplicationStartResponseSchema,
)
from src.api.route_utils import raise_flask_error
from src.auth.api_key_auth import api_key_auth
from src.db.models.competition_models import Application, Competition

logger = logging.getLogger(__name__)


@application_blueprint.post("/applications/start")
@application_blueprint.input(ApplicationStartRequestSchema, location="json")
@application_blueprint.output(ApplicationStartResponseSchema)
@application_blueprint.doc(responses=[200, 401, 404])
@application_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def application_start(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    """Create a new application for a competition"""
    logger.info("POST /v1/applications/start")

    competition_id = json_data["competition_id"]

    all_competitions = db_session.execute(select(Competition)).scalars().all()
    competition_ids = [str(comp.competition_id) for comp in all_competitions]
    logger.info(f"All competition IDs in database: {competition_ids}")
    logger.info(f"Looking for competition ID: {competition_id}")
    logger.info(f"Total competitions found: {len(competition_ids)}")
    
    # Check if competition exists
    competition = db_session.execute(
        select(Competition).where(Competition.competition_id == competition_id)
    ).scalar_one_or_none()


    if not competition:
        print(f"Competition with ID {competition_id} not found")
        raise_flask_error(404, f"Competition with ID {competition_id} not found")

    # Create a new application
    application = Application(application_id=uuid.uuid4(), competition_id=competition_id)

    with db_session.begin():
        db_session.add(application)

    logger.info(
        "Created new application",
        extra={
            "application_id": str(application.application_id),
            "competition_id": str(competition_id),
        },
    )

    return response.ApiResponse(
        message="Success", data={"application_id": str(application.application_id)}
    )
