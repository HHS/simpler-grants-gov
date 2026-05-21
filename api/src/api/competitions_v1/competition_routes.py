import logging

import src.adapters.db as db
import src.api.response as response
from src.adapters.db import flask_db
from src.api.competitions_v1 import competition_schemas
from src.api.competitions_v1.competition_blueprint import competition_blueprint
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.competitions_v1.competition_creation import create_competition

logger = logging.getLogger(__name__)


@competition_blueprint.post("/")
@competition_blueprint.input(competition_schemas.CompetitionCreateRequestSchema(), location="json")
@competition_blueprint.output(competition_schemas.CompetitionCreateResponseSchema())
@competition_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@competition_blueprint.doc(responses=[200, 403, 404, 422, 500])
@flask_db.with_db_session()
def competition_create(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    """Create a new competition"""
    add_extra_data_to_current_request_logs({"opportunity_id": json_data.get("opportunity_id")})
    logger.info("POST /v1/competitions")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        competition = create_competition(db_session, user, json_data)

    return response.ApiResponse(message="Success", data=competition)
