import logging
import os

from dotenv import load_dotenv

logger = logging.getLogger(__name__)


def load_local_env_vars(env_file: str = "local.env") -> None:
    """
    Load environment variables from the local.env so
    that they can be fetched with `os.getenv()` or with
    other utils that pull env vars.

    https://pypi.org/project/python-dotenv/

    NOTE: any existing env vars will not be overriden by this
    """
    environment = os.getenv("ENVIRONMENT", None)

    # If the environment is explicitly local or undefined
    # we'll use the dotenv file, otherwise we'll skip
    # Should never run if not local development
    if environment is None or environment == "local":
        load_dotenv(env_file)


def error_if_not_local() -> None:
    if (env := os.getenv("ENVIRONMENT")) != "local":
        logger.error("Environment %s is not local - cannot run operation", env)
        raise Exception("Local-only process called when environment was set to non-local")
