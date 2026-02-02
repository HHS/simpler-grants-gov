"""Module for adding standard logging functionality to a Flask app.

This module configures an application's logger to add extra data
to all log messages. Flask application context data such as the
app name and request context data such as the request method, request url
rule, and query parameters are added to the log record.

This module also configures the Flask application to log every
non-404 request.

Usage:
    import src.logging.flask_logger as flask_logger

    logger = logging.getLogger(__name__)
    app = create_app()

    flask_logger.init_app(logger, app)
"""

import logging
import os
import sys
import time
import uuid

import flask
import newrelic.api.time_trace

from src.util.deploy_metadata import get_deploy_metadata_config

logger = logging.getLogger(__name__)
EXTRA_LOG_DATA_ATTR = "extra_log_data"

_GLOBAL_LOG_CONTEXT: dict = {}


def init_general_logging(app_logger: logging.Logger, app_name: str) -> None:
    """Initialize logging that doesn't depend on a Flask app

    If possible, use init_app instead which is called when we
    create a flask app, this is only necessary for scripts that
    aren't possible to run via Flask like our Alembic migrations
    """

    # Need to add filters to each of the handlers rather than to the logger itself, since
    # messages are passed directly to the ancestor loggers’ handlers bypassing any filters
    # set on the ancestors.
    # See https://docs.python.org/3/library/logging.html#logging.Logger.propagate
    for handler in app_logger.handlers:
        handler.addFilter(_add_global_context_info_to_log_record)
        handler.addFilter(_add_request_context_info_to_log_record)
        handler.addFilter(_add_new_relic_context_to_log_record)
        handler.addFilter(_add_error_info_to_log_record)

    deploy_metadata = get_deploy_metadata_config()

    # Add some metadata to all log messages globally
    add_extra_data_to_global_logs(
        {
            "app.name": app_name,
            "app_name": "api",
            "run_mode": get_run_mode(),
            "environment": os.environ.get("ENVIRONMENT"),
            "deploy_github_ref": deploy_metadata.deploy_github_ref,
            "deploy_github_sha": deploy_metadata.deploy_github_sha,
            "deploy_whoami": deploy_metadata.deploy_whoami,
        }
    )

    app_logger.info("initialized flask logger")


def init_app(app_logger: logging.Logger, app: flask.Flask) -> None:
    """Initialize the Flask app logger.

    Adds Flask app context data and Flask request context data
    to every log record using log filters.
    See https://docs.python.org/3/howto/logging-cookbook.html#using-filters-to-impart-contextual-information

    Also configures the app to log every non-404 request using the given logger.

    Usage:
        import src.logging.flask_logger as flask_logger

        logger = logging.getLogger(__name__)
        app = create_app()

        flask_logger.init_app(logger, app)
    """

    # Add request context data to every log record for the current request
    # such as request id, request method, request path, and the matching Flask request url rule
    app.before_request(
        lambda: add_extra_data_to_current_request_logs(_get_request_context_info(flask.request))
    )

    app.before_request(_track_request_start_time)
    app.before_request(_log_start_request)
    app.after_request(_log_end_request)

    init_general_logging(app_logger, app.name)


def add_extra_data_to_current_request_logs(
    data: dict[str, str | int | float | bool | uuid.UUID | None]
) -> None:
    """Add data to every log record for the current request."""
    if not flask.has_request_context():
        return

    extra_log_data = getattr(flask.g, EXTRA_LOG_DATA_ATTR, {})
    extra_log_data.update(data)
    setattr(flask.g, EXTRA_LOG_DATA_ATTR, extra_log_data)


def add_extra_data_to_global_logs(data: dict[str, str | int | float | bool | None]) -> None:
    """Add metadata to all logs for the rest of the lifecycle of this app process"""
    global _GLOBAL_LOG_CONTEXT
    _GLOBAL_LOG_CONTEXT.update(data)


def _track_request_start_time() -> None:
    """Store the request start time in flask.g"""
    flask.g.request_start_time = time.perf_counter()


def _log_start_request() -> None:
    """Log the start of a request.

    This function handles the Flask's before_request event.
    See https://tedboy.github.io/flask/interface_src.application_object.html#flask.Flask.before_request

    Additional info about the request will be in the `extra` field
    added by `_add_request_context_info_to_log_record`
    """
    logger.info("start request")


def _log_end_request(response: flask.Response) -> flask.Response:
    """Log the end of a request.

    This function handles the Flask's after_request event.
    See https://tedboy.github.io/flask/interface_src.application_object.html#flask.Flask.after_request

    Additional info about the request will be in the `extra` field
    added by `_add_request_context_info_to_log_record`
    """

    logger.info(
        "end request",
        extra={
            "response.status_code": response.status_code,
            "response.content_length": response.content_length,
            "response.content_type": response.content_type,
            "response.mimetype": response.mimetype,
            "response.time_ms": (time.perf_counter() - flask.g.request_start_time) * 1000,
        },
    )
    return response


def _add_request_context_info_to_log_record(record: logging.LogRecord) -> bool:
    """Add request context data to the log record.

    If there is no request context, then do not add any data.
    """
    if not flask.has_request_context():
        return True

    assert flask.request is not None
    extra_log_data: dict[str, str] = getattr(flask.g, EXTRA_LOG_DATA_ATTR, {})
    record.__dict__.update(extra_log_data)

    return True


def _add_global_context_info_to_log_record(record: logging.LogRecord) -> bool:
    global _GLOBAL_LOG_CONTEXT
    record.__dict__ |= _GLOBAL_LOG_CONTEXT

    return True


def _get_request_context_info(request: flask.Request) -> dict:
    internal_request_id = str(uuid.uuid4())
    flask.g.internal_request_id = internal_request_id

    data = {
        "request.id": request.headers.get("x-amzn-requestid", ""),
        "request.method": request.method,
        "request.path": request.path,
        "request.url_rule": str(request.url_rule),
        # This ID is used to group all logs for a given request
        # and is returned in the API response for any 4xx/5xx scenarios
        "request.internal_id": internal_request_id,
    }

    # Add query parameter data in the format request.query.<key> = <value>
    # For example, the query string ?foo=bar&baz=qux would be added as
    # request.query.foo = bar and request.query.baz = qux
    # PII should be kept out of the URL, as URLs are logged in access logs.
    # With that assumption, it is safe to log query parameters.
    for key, value in request.args.items():
        data[f"request.query.{key}"] = value
    return data


def _add_new_relic_context_to_log_record(record: logging.LogRecord) -> bool:
    """Add New Relic tracing info to our log record."""

    # This is not the recommended way of implementing this, but the alternatives
    # either change the structure of our logging to not be JSON, or would
    # entirely replace the formatter we have for outputting logs.
    #
    # The NewRelicContextFormatter calls this function internally when it
    # creates the output object.
    #
    # This sets the following fields:
    # entity.type
    # entity.name
    # entity.guid
    # hostname
    # span.id
    # trace.id
    newrelic_metadata = newrelic.api.time_trace.get_linking_metadata()

    record.__dict__ |= newrelic_metadata

    return True


def _add_error_info_to_log_record(record: logging.LogRecord) -> bool:
    """Add a shorter form of the error message to our log record."""
    exc_info = getattr(record, "exc_info", None)
    # exc_info is a 3-part tuple with the class, error obj, and traceback
    if exc_info and len(exc_info) == 3:
        # Add the exception class name to the logs, check that it
        # is a class just in case there is some code path that sets this different.
        if isinstance(exc_info[0], type):
            record.__dict__["exc_info_cls"] = exc_info[0].__name__
        # If the error were `raise ValueError("example")`, the
        # value of this would be "ValueError('example')"
        record.__dict__["exc_info_short"] = repr(exc_info[1])

    return True


def get_run_mode() -> str:
    # We want to indicate whether the app was run as an API service
    # or as a CLI - use the argv of the command we ran it with
    # to determine that.
    # CLI commands are always of the form "/path/to/flask <blueprint name> <task name> <commands>"
    #
    # The API service can be started either as
    #  "/path/to/flask --app src.app run ..."         --> When run locally
    #  "/api/.venv/bin/gunicorn src.app:create_app()" --> When run non-locally
    #
    # So we check for pieces that only appear in the API commands

    _original_argv = " ".join(sys.argv)
    run_mode = "cli"
    if "gunicorn" in _original_argv or "--app" in _original_argv:
        run_mode = "service"

    return run_mode
