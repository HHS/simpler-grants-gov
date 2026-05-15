"""Module for initializing logging configuration for the application.

There are two formatters for the log messages: human-readable and JSON.
The formatter that is used is determined by the environment variable
LOG_FORMAT. If the environment variable is not set, the JSON formatter
is used by default. See grants_shared.logs.formatters for more information.

The logger also adds a PII mask filter to the root logger. See
grants_shared.logs.pii for more information.

Usage:
    import grants_shared.logs

    with grants_shared.logs.init("program name"):
        ...

Once the module has been initialized, the standard logging module can be
used to log messages:

Example:
    import logging

    logger = logging.getLogger(__name__)
    logger.info("message")
"""

import grants_shared.logs.config as config


def init(program_name: str) -> config.LoggingContext:
    return config.LoggingContext(program_name)
