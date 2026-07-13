import functools
import logging
import urllib
import uuid
from collections.abc import Callable
from typing import Any, ParamSpec

import flask
from apiflask.exceptions import HTTPError
from grants_shared.adapters import db
from grants_shared.api import response
from grants_shared.auth.login_gov_jwt_auth import (
    LOGIN_GOV_PIV_REQUIRED,
    LoginGovConfig,
    RedirectParams,
    get_config,
    get_final_redirect_uri,
)

from src.auth.auth_handler import MgmtAuthHandler

logger = logging.getLogger(__name__)

P = ParamSpec("P")
INTERNAL_ERROR = "internal error"


def get_app_security_scheme() -> dict[str, Any]:
    return {
        "ApiJwtAuth": {"type": "apiKey", "in": "header", "name": "X-MGMT-Token"},
        "ApiUserKeyAuth": {"type": "apiKey", "in": "header", "name": "X-API-Key"},
    }


def with_login_redirect_error_handler() -> Callable[..., Callable[P, flask.Response]]:
    """Wrapper function to handle catching errors and redirecting

    Because several of our login functions don't have standard 2xx returns
    and instead redirect the user, we also redirect in the case of errors
    so that they stay on the frontend, but we pass errors along.

    Usage::

        @with_login_redirect_error_handler()
        def foo(...):
            logger.info("hello")

            if condition:
                raise_flask_error(...) # this will get caught and a redirect will occur

            return ...

    """

    def decorator(f: Callable[P, flask.Response]) -> Callable[P, flask.Response]:
        @functools.wraps(f)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> flask.Response:
            try:
                return f(*args, **kwargs)
            except HTTPError as e:
                # HTTPError is what raise_flask_error raises
                # and should encompass our "expected" errors
                # that aren't a concern, as long as it isn't a 5xx
                message = e.message
                logger.info("Login flow failed: %s", message)

                # But we still don't expect 5xx errors
                if e.status_code >= 500:
                    message = INTERNAL_ERROR
                    logger.exception(
                        "Unexpected error occurred in login flow via raise_flask_error: %s",
                        e.message,
                    )

                return response.redirect_response(
                    get_final_redirect_uri(
                        "error",
                        error_description=message,
                        login_piv_required_error=e.extra_data.get("login_piv_required_error", None),
                    )
                )
            except Exception:
                # Any other exception, we'll just use a generic error message to be safe
                # but this means an unexpected error occurred and we should log an error
                logger.exception("Unexpected error occurred in login flow")
                return response.redirect_response(
                    get_final_redirect_uri("error", error_description=INTERNAL_ERROR)
                )

        return wrapper

    return decorator


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
    MgmtAuthHandler(db_session).create_login_gov_state(state, nonce)

    return f"{config.login_gov_auth_endpoint}?{encoded_params}"
