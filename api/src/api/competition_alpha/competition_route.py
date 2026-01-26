import logging
import uuid

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.competition_alpha.competition_schema as competition_schema
import src.api.response as response
from src.api.competition_alpha.competition_blueprint import competition_blueprint
from src.auth.api_user_key_auth import api_user_key_auth
from src.auth.multi_auth import jwt_or_key_multi_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.competition_alpha.get_competition import get_competition
from src.services.competition_alpha.put_competition_forms import set_competition_forms
from src.services.competition_alpha.update_competition_flag import update_competition_flag

logger = logging.getLogger(__name__)


@competition_blueprint.get("/competitions/<uuid:competition_id>")
@competition_blueprint.output(competition_schema.CompetitionResponseAlphaSchema())
@competition_blueprint.auth_required(jwt_or_key_multi_auth)
@flask_db.with_db_session()
def competition_get(db_session: db.Session, competition_id: uuid.UUID) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"competition_id": competition_id})
    logger.info("GET /alpha/competitions/:competition_id")

    with db_session.begin():
        competition = get_competition(db_session, competition_id)

    return response.ApiResponse(message="Success", data=competition)


@competition_blueprint.put("/competitions/<uuid:competition_id>/flag")
@competition_blueprint.input(competition_schema.CompetitionFlagUpdateSchema, location="json")
@competition_blueprint.output(competition_schema.CompetitionResponseAlphaSchema())
@competition_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def update_competition_flag_route(
    db_session: db.Session, competition_id: uuid.UUID, json_data: dict[str, bool]
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"competition_id": competition_id})
    logger.info("PUT /alpha/competitions/:competition_id/flag")

    is_enabled = json_data.get("is_simpler_grants_enabled", False)

    with db_session.begin():
        user = api_user_key_auth.get_user()
        db_session.add(user)

        competition = update_competition_flag(db_session, competition_id, is_enabled, user)

        return response.ApiResponse(message="Success", data=competition)


@competition_blueprint.put("/competitions/<uuid:competition_id>/forms")
@competition_blueprint.input(competition_schema.CompetitionFormsSetRequestSchema, location="json")
@competition_blueprint.output(competition_schema.CompetitionResponseAlphaSchema())
@competition_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def put_competition_forms(
    db_session: db.Session, competition_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"competition_id": competition_id})
    logger.info("PUT /alpha/competitions/:competition_id/forms")

    with db_session.begin():
        user = api_user_key_auth.get_user()
        db_session.add(user)

        competition = set_competition_forms(db_session, user, competition_id, json_data)

        return response.ApiResponse(message="Success", data=competition)
