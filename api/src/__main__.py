#!/usr/bin/env python3

# If __main__.py is present in a Python module, it will be executed by default
# if that module is executed, e.g., `python -m my.module`.
#
# https://docs.python.org/3/library/__main__.html

import logging

import src.app
import src.logging
from src.app_config import AppConfig

logger = logging.getLogger(__package__)


def main() -> None:
    app_config = AppConfig()

    app = src.app.create_app()

    environment = app_config.environment

    # When running in a container, the host needs to be set to 0.0.0.0 so that the app can be
    # accessed from outside the container. See Dockerfile
    host = app_config.host
    port = app_config.port

    logger.info(
        "Running API Application", extra={"environment": environment, "host": host, "port": port}
    )

    if app_config.environment == "local":
        # If python files are changed, the app will auto-reload
        # Note this doesn't have the OpenAPI yaml file configured at the moment
        app.run(host=host, port=port, use_reloader=True, reloader_type="stat")
    else:
        # Don't enable the reloader if non-local
        app.run(host=host, port=port)


main()
