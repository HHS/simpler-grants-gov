"""Entrypoint for initializing NewRelic."""

import logging
import os
from pathlib import Path

import newrelic.agent

logger = logging.getLogger(__name__)

__is_initialized: bool = False


def init_newrelic() -> None:
    """Initialize New Relic agent."""
    # The unit tests can call this function multiple
    # times which New Relic doesn't like, so only
    # initialize it once.
    global __is_initialized  # noqa: PLW0603, pylint: disable=global-statement
    if not __is_initialized:
        _init_newrelic()
        __is_initialized = True


def _init_newrelic() -> None:
    logger.info("Initializing New Relic")
    newrelic.agent.initialize(
        config_file=Path(Path(__file__).parent) / "../../.." / "newrelic.ini",
        environment=os.environ.get("ENVIRONMENT", "local"),
    )
