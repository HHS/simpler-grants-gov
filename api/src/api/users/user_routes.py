import logging
import src.adapters.db as db

import src.adapters.db.flask_db as flask_db

from src.api import response
from src.api.route_utils import raise_flask_error
from src.api.users import user_schemas
from src.api.users.user_blueprint import user_blueprint
from src.auth.api_key_auth import api_key_auth
from src.services.users.login_gov_token_handler import process_login_gov_token

logger = logging.getLogger(__name__)


@user_blueprint.post("/token")
@user_blueprint.input(
    user_schemas.UserTokenHeaderSchema, location="headers", arg_name="x_oauth_login_gov"
)
@user_blueprint.output(user_schemas.UserTokenResponseSchema)
@user_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def user_token(db_session: db.Session, x_oauth_login_gov: dict) -> response.ApiResponse:
    logger.info("POST /v1/users/token")

    with db_session.begin():
        # UserTokenHeaderSchema validates that the header is present, so safe to fetch this way
        result = process_login_gov_token(x_oauth_login_gov["x_oauth_login_gov"], db_session)

        logger.info("Successfully generated token for user")
        return response.ApiResponse(message="Success", data=result)
