import logging
import uuid

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.competition_alpha.competition_schema as competition_schema
import src.api.response as response
from src.api.competition_alpha.competition_blueprint import competition_blueprint
from src.auth.api_key_auth import api_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.competition_alpha.get_competition import get_competition

logger = logging.getLogger(__name__)


@competition_blueprint.get("/competitions/<uuid:competition_id>")
@competition_blueprint.output(competition_schema.CompetitionResponseAlphaSchema())
@competition_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def competition_get(db_session: db.Session, competition_id: uuid.UUID) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"competition.competition_id": competition_id})
    logger.info("GET /alpha/competitions/:competition_id")

    with db_session.begin():
        form = get_competition(db_session, competition_id)

    return response.ApiResponse(message="Success", data=form)
