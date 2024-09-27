# pylint: disable=invalid-name, line-too-long
"""Get a connection to the database using a SQLAlchemy engine object."""

from sqlalchemy import Engine, create_engine

from config import get_db_settings

# The variables used in the connection url are pulled from local.env
# and configured in the DBSettings class found in config.py


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
    db = get_db_settings()
    print(f"postgresql+psycopg://{db.user}:{db.password}@{db.db_host}:{db.port}")
    return create_engine(
        f"postgresql+psycopg://{db.user}:{db.password}@{db.db_host}:{db.port}",
        pool_pre_ping=True,
        hide_parameters=True,
    )
