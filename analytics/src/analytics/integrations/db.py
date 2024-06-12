# pylint: disable=invalid-name, line-too-long
"""Get a connection to the database using a SQLAlchemy engine object."""

from sqlalchemy import Engine, create_engine

from config import settings


# The variables used in the connection url are set in settings.toml and
# .secrets.toml. These can be overridden with the custom prefix defined in config.py: "ANALYTICS".
# e.g. `export ANALYTICS_POSTGRES_USER=new_usr`.
# Docs: https://www.dynaconf.com/envvars/
def get_db() -> Engine:
    """
    Get a connection to the database using a SQLAlchemy engine object.

    This function retrieves the database connection URL from the configuration
    and creates a SQLAlchemy engine object.

    Yields
    ------
    sqlalchemy.engine.Engine
    A SQLAlchemy engine object representing the connection to the database.
    """
    return create_engine(
        f"postgresql+psycopg://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_host}:{settings.postgres_port}",
        pool_pre_ping=True,
        hide_parameters=True,
    )
