"""Module for initializing logging configuration for the application.

There are two formatters for the log messages: human-readable and JSON.
The formatter that is used is determined by the environment variable
LOG_FORMAT. If the environment variable is not set, the JSON formatter
is used by default. See src.logging.formatters for more information.

The logger also adds a PII mask filter to the root logger. See
src.logging.pii for more information.

Usage:
    import src.logging

    with src.logging.init("program name"):
        ...

Once the module has been initialized, the standard logging module can be
used to log messages:

Example:
    import logging

    logger = logging.getLogger(__name__)
    logger.info("message")
"""

import src.logging.config as config


def init(program_name: str) -> config.LoggingContext:
    return config.LoggingContext(program_name)
