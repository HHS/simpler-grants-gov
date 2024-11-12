# pylint: disable=invalid-name, line-too-long
"""Get a connection to the database using a SQLAlchemy engine object."""

import boto3
from sqlalchemy import Engine, create_engine

from config import DBSettings, get_db_settings

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
    # inspired by simpler-grants-gov/blob/main/api/src/adapters/db/clients/postgres_client.py
    token = db.password if db.local_env is True else generate_iam_auth_token(db)

    return create_engine(
        f"postgresql+psycopg://{db.user}:{token}@{db.db_host}:{db.port}",
        pool_pre_ping=True,
        hide_parameters=True,
    )


def generate_iam_auth_token(settings: DBSettings) -> str:
    """Generate IAM auth token."""
    if settings.aws_region is None:
        msg = "AWS region needs to be configured for DB IAM auth"
        raise ValueError(msg)
    client = boto3.client("rds", region_name=settings.aws_region)
    return client.generate_db_auth_token(
        DBHostname=settings.db_host,
        Port=settings.port,
        DBUsername=settings.user,
        Region=settings.aws_region,
    )
