import functools
import logging
from http import HTTPStatus
from typing import Callable, ParamSpec

import flask
from apiflask.exceptions import HTTPError
from pydantic import ValidationError

from src.api.route_utils import raise_flask_error
from src.services.common_grants.transformation import transform_validation_error_from_cg

logger = logging.getLogger(__name__)

P = ParamSpec("P")

ERROR_MSG_PREFIX = "CommonGrants runtime exception"
VALIDATION_ERROR = "Validation error"
UNCAUGHT_EXCEPTION = "Uncaught exception"


def with_cg_error_handler() -> Callable[..., Callable[P, flask.Response]]:
    """Catch and transform errors thrown by CommonGrants routes."""

    def decorator(f: Callable[P, flask.Response]) -> Callable[P, flask.Response]:

        @functools.wraps(f)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> flask.Response:
            try:
                return f(*args, **kwargs)

            except ValidationError as e:
                # This type of error is typically thrown when a schema cannot be validated
                m = "{}: {}".format(ERROR_MSG_PREFIX, VALIDATION_ERROR)
                logger.info(m)
                error_details = transform_validation_error_from_cg(e)
                raise_flask_error(
                    HTTPStatus.UNPROCESSABLE_ENTITY, m, validation_issues=error_details
                )

            except HTTPError as e:
                # This type of error is typically thrown by `raise_flask_error()`
                m = "{}: {}".format(ERROR_MSG_PREFIX, e.message)
                if e.status_code < 500:
                    logger.info(m)
                else:
                    logger.exception(m)
                raise_flask_error(e.status_code, m)

            except Exception as e:
                # This type of error encapsulates unknown edge cases
                m = "{}: {}".format(ERROR_MSG_PREFIX, (getattr(e, "message", UNCAUGHT_EXCEPTION)))
                logger.exception(m)
                raise_flask_error(HTTPStatus.INTERNAL_SERVER_ERROR, m)

        return wrapper

    return decorator
