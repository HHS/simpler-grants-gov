import logging
import os

import newrelic.agent

logger = logging.getLogger(__name__)


def init_newrelic() -> None:
    logger.info("Initializing New Relic")
    newrelic.agent.initialize(
        config_file=os.path.join(os.path.dirname(__file__), "../../..", "newrelic.ini"),
        environment=os.environ.get("ENVIRONMENT", "local"),
    )
