import logging
import os
import platform
import pwd
import sys
from typing import Any, ContextManager, cast

from pydantic_settings import SettingsConfigDict

import src.logging.audit
import src.logging.formatters as formatters
import src.logging.pii as pii
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

_original_argv = tuple(sys.argv)


class HumanReadableFormatterConfig(PydanticBaseEnvConfig):
    message_width: int = formatters.HUMAN_READABLE_FORMATTER_DEFAULT_MESSAGE_WIDTH


class LoggingConfig(PydanticBaseEnvConfig):
    model_config = SettingsConfigDict(env_prefix="log_", env_nested_delimiter="__")

    format: str = "json"
    level: str = "INFO"
    enable_audit: bool = False
    human_readable_formatter: HumanReadableFormatterConfig = HumanReadableFormatterConfig()


class LoggingContext(ContextManager[None]):
    """
    A context manager for handling setting up the logging stream.

    To help facillitate being able to test logging, we need to be able
    to easily create temporary output streams and then tear them down.

    When this context manager is torn down, the stream handler created
    with it will be removed.

    For example:
    ```py
    import logging

    logger = logging.getLogger(__name__)

    with LoggingContext("example_program_name"):
        # This log message will go to stdout
        logger.info("example log message")

    # This log message won't go to stdout as the
    # handler will have been removed
    logger.info("example log message")
    ```
    Note that any other handlers added to the root logger won't be affected
    and calling this multiple times before exit would result in duplicate logs.
    """

    def __init__(self, program_name: str) -> None:
        self._configure_logging()
        log_program_info(program_name)

    def __enter__(self) -> None:
        pass

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        # Remove the console handler to stop logs from being sent to stdout
        # This is useful in the test suite, since multiple tests may initialize
        # separate duplicate handlers. This allows for easier cleanup for each
        # of those tests.
        logging.root.removeHandler(self.console_handler)

    def _configure_logging(self) -> None:
        """Configure logging for the application.

        Configures the root module logger to log to stdout.
        Adds a PII mask filter to the root logger.
        Also configures log levels third party packages.
        """
        config = LoggingConfig()

        # Loggers can be configured using config functions defined
        # in logging.config or by directly making calls to the main API
        # of the logging module (see https://docs.python.org/3/library/logging.config.html)
        # We opt to use the main API using functions like `addHandler` which is
        # non-destructive, i.e. it does not overwrite any existing handlers.
        # In contrast, logging.config.dictConfig() would overwrite any existing loggers.
        # This is important during testing, since fixtures like `caplog` add handlers that would
        # get overwritten if we call logging.config.dictConfig() during the scope of the test.
        self.console_handler = logging.StreamHandler(sys.stdout)
        formatter = get_formatter(config)
        self.console_handler.setFormatter(formatter)
        self.console_handler.addFilter(pii.mask_pii)
        logging.root.addHandler(self.console_handler)
        logging.root.setLevel(config.level)

        if config.enable_audit:
            src.logging.audit.init()

        # Configure loggers for third party packages
        logging.getLogger("alembic").setLevel(logging.INFO)
        logging.getLogger("werkzeug").setLevel(logging.WARN)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.dialects.postgresql").setLevel(logging.INFO)


def get_formatter(config: LoggingConfig) -> logging.Formatter:
    """Return the formatter used by the root logger.

    The formatter is determined by the environment variable LOG_FORMAT. If the
    environment variable is not set, the JSON formatter is used by default.
    """
    if config.format == "human-readable":
        return get_human_readable_formatter(config.human_readable_formatter)
    return formatters.JsonFormatter()


def log_program_info(program_name: str) -> None:
    logger.info(
        "start %s: %s %s %s, hostname %s, pid %i, user %i(%s)",
        program_name,
        platform.python_implementation(),
        platform.python_version(),
        platform.system(),
        platform.node(),
        os.getpid(),
        os.getuid(),
        pwd.getpwuid(os.getuid()).pw_name,
        extra={
            "hostname": platform.node(),
            "cpu_count": os.cpu_count(),
            # If mypy is run on a mac, it will throw a module has no attribute error, even though
            # we never actually access it with the conditional.
            #
            # However, we can't just silence this error, because on linux (e.g. CI/CD) that will
            # throw an unused “type: ignore” comment error. Casting to Any instead ensures this
            # passes regardless of where mypy is being run
            "cpu_usable": (
                len(cast(Any, os).sched_getaffinity(0))
                if "sched_getaffinity" in dir(os)
                else "unknown"
            ),
        },
    )
    logger.info("invoked as: %s", " ".join(_original_argv))


def get_human_readable_formatter(
    config: HumanReadableFormatterConfig,
) -> formatters.HumanReadableFormatter:
    """Return the human readable formatter used by the root logger."""
    return formatters.HumanReadableFormatter(message_width=config.message_width)
