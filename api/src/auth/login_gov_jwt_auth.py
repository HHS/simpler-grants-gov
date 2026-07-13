import logging
import urllib
import uuid

import flask
from grants_shared.adapters import db
from grants_shared.auth.login_gov_jwt_auth import (
    LOGIN_GOV_PIV_REQUIRED,
    LoginGovConfig,
    RedirectParams,
    get_config,
)

from src.auth.auth_handler import AuthHandler

logger = logging.getLogger(__name__)


def get_login_gov_redirect_uri(
    query_data: dict, db_session: db.Session, config: LoginGovConfig | None = None
) -> str:
    if config is None:
        config = get_config()

    nonce = uuid.uuid4()
    state = uuid.uuid4()

    redirect_params = RedirectParams.model_validate(query_data)

    # Ask Flask for its own URI - specifying we want the callback route
    # .user_login_callback points to the function itself defined in user_routes.py
    redirect_uri = flask.url_for(
        ".user_login_callback", _external=True, _scheme=config.login_gov_redirect_scheme
    )

    url_params = {
        "client_id": config.client_id,
        "nonce": nonce,
        "state": state,
        "redirect_uri": redirect_uri,
        "acr_values": config.acr_value,
        "scope": config.scope,
        # These are statically defined by the spec
        "prompt": "select_account",
        "response_type": "code",
    }
    if redirect_params.piv_required:
        url_params["acr_values"] = config.acr_value + " " + LOGIN_GOV_PIV_REQUIRED

    # We want to redirect to the authorization endpoint of login.gov
    # See: https://developers.login.gov/oidc/authorization/
    encoded_params = urllib.parse.urlencode(url_params)

    # Add the state to the DB
    AuthHandler(db_session).create_login_gov_state(state, nonce)

    return f"{config.login_gov_auth_endpoint}?{encoded_params}"
