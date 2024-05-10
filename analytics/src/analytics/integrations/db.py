# pylint: disable=invalid-name
"""Get a connection to the database using a SQLAlchemy engine object."""

from sqlalchemy import Engine, create_engine

from config import settings


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
    return create_engine(settings.database_url, pool_pre_ping=True)
