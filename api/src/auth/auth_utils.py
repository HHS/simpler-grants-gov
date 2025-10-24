import functools
import logging
from collections.abc import Callable
from typing import Any, ParamSpec

import flask
from apiflask.exceptions import HTTPError

from src.api import response
from src.auth.login_gov_jwt_auth import get_final_redirect_uri

logger = logging.getLogger(__name__)

P = ParamSpec("P")
INTERNAL_ERROR = "internal error"


def get_app_security_scheme() -> dict[str, Any]:
    return {
        "ApiKeyAuth": {"type": "apiKey", "in": "header", "name": "X-Auth"},
        "ApiJwtAuth": {"type": "apiKey", "in": "header", "name": "X-SGG-Token"},
        "InternalApiJwtAuth": {"type": "apiKey", "in": "header", "name": "X-SGG-Internal-Token"},
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
                    get_final_redirect_uri("error", error_description=message)
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
