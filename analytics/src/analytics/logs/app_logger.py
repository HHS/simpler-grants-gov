# pylint: disable=global-variable-not-assigned
"""
Module for adding standard logging functionality to an app.

This module configures an application's logger to add extra data
to all log messages. Application context data such as the app name.

Usage:
    import logging
    import analytics.logs.app_logger as app_logger

    logger = logging.getLogger(__name__)

    app_logger.init_app(logging.root)
"""

import logging
import os

EXTRA_LOG_DATA_ATTR = "extra_log_data"

_GLOBAL_LOG_CONTEXT: dict = {}


def init_app(app_logger: logging.Logger) -> None:
    """
    Initialize the app logger.

    Adds app context data to every log record using log filters.
    https://docs.python.org/3/howto/logging-cookbook.html#using-filters-to-impart-contextual-information

    Usage:
        import logging
        import analytics.logs.app_logger as app_logger

        logger = logging.getLogger(__name__)

        app_logger.init_app(logging.root)
    """
    # Need to add filters to each of the handlers rather than to the logger itself, since
    # messages are passed directly to the ancestor loggers` handlers bypassing any filters
    # set on the ancestors.
    # See https://docs.python.org/3/library/logging.html#logging.Logger.propagate
    for handler in app_logger.handlers:
        handler.addFilter(_add_global_context_info_to_log_record)

    # Add some metadata to all log messages globally
    add_extra_data_to_global_logs({"environment": os.environ.get("ENVIRONMENT")})

    app_logger.info("initialized logger")


def add_extra_data_to_global_logs(
    data: dict[str, str | int | float | bool | None],
) -> None:
    """Add metadata to all logs for the rest of the lifecycle of this app process."""
    global _GLOBAL_LOG_CONTEXT  # noqa: PLW0602
    _GLOBAL_LOG_CONTEXT.update(data)


def _add_global_context_info_to_log_record(record: logging.LogRecord) -> bool:
    global _GLOBAL_LOG_CONTEXT  # noqa: PLW0602
    record.__dict__ |= _GLOBAL_LOG_CONTEXT

    return True
