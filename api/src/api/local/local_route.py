import logging

import src.adapters.db as db
import src.api.response as response
from src.adapters.db import flask_db
from src.api.local.local_blueprint import local_blueprint
from src.api.local.local_schema import LocalUserTokenResponseSchema
from src.services.local.get_local_users import get_local_users
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


@local_blueprint.get("/local-users")
@local_blueprint.output(LocalUserTokenResponseSchema)
@flask_db.with_db_session()
def local_users_get(db_session: db.Session) -> response.ApiResponse:
    logger.info("GET /local/local-users")
    # THIS ENDPOINT ONLY RUNS LOCALLY
    error_if_not_local()

    with db_session.begin():
        users = get_local_users(db_session)

    return response.ApiResponse(message="Success", data=users)
