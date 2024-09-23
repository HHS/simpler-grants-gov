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
import time
import uuid

import flask

logger = logging.getLogger(__name__)
EXTRA_LOG_DATA_ATTR = "extra_log_data"

_GLOBAL_LOG_CONTEXT: dict = {}


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

    # Need to add filters to each of the handlers rather than to the logger itself, since
    # messages are passed directly to the ancestor loggers’ handlers bypassing any filters
    # set on the ancestors.
    # See https://docs.python.org/3/library/logging.html#logging.Logger.propagate
    for handler in app_logger.handlers:
        handler.addFilter(_add_request_context_info_to_log_record)
        handler.addFilter(_add_global_context_info_to_log_record)

    # Add request context data to every log record for the current request
    # such as request id, request method, request path, and the matching Flask request url rule
    app.before_request(
        lambda: add_extra_data_to_current_request_logs(_get_request_context_info(flask.request))
    )

    app.before_request(_track_request_start_time)
    app.before_request(_log_start_request)
    app.after_request(_log_end_request)

    # Add some metadata to all log messages globally
    add_extra_data_to_global_logs(
        {"app.name": app.name, "environment": os.environ.get("ENVIRONMENT")}
    )

    app_logger.info("initialized flask logger")


def add_extra_data_to_current_request_logs(
    data: dict[str, str | int | float | bool | None]
) -> None:
    """Add data to every log record for the current request."""
    assert flask.has_request_context(), "Must be in a request context"

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
    data = {
        "request.id": request.headers.get("x-amzn-requestid", ""),
        "request.method": request.method,
        "request.path": request.path,
        "request.url_rule": str(request.url_rule),
        # A backup ID in case the x-amzn-requestid isn't passed in
        # doesn't help with tracing across systems, but at least links within a request
        "request.internal_id": str(uuid.uuid4()),
    }

    # Add query parameter data in the format request.query.<key> = <value>
    # For example, the query string ?foo=bar&baz=qux would be added as
    # request.query.foo = bar and request.query.baz = qux
    # PII should be kept out of the URL, as URLs are logged in access logs.
    # With that assumption, it is safe to log query parameters.
    for key, value in request.args.items():
        data[f"request.query.{key}"] = value
    return data
