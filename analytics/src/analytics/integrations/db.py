# pylint: disable=invalid-name, line-too-long
"""Get a connection to the database using a SQLAlchemy engine object."""

from typing import Any, cast

import boto3
import psycopg
from sqlalchemy import Connection, Engine, create_engine, pool

from config import DBSettings, get_db_settings

# The variables used in the connection url are pulled from local.env
# and configured in the DBSettings class found in config.py


class PostgresDbClient:
    """An implementation of of a Postgres db client."""

    def __init__(self, config: DBSettings | None = None) -> None:
        """Construct a class instance."""
        if not config:
            config = get_db_settings()
        self._engine = self._configure_engine(config)

    def _configure_engine(self, config: DBSettings) -> Engine:
        """Configure db engine to use short-lived IAM tokens for access."""

        # inspired by /api/src/adapters/db/clients/postgres_client.py
        def get_conn() -> psycopg.Connection:
            """Get a psycopg connection."""
            return psycopg.connect(**get_connection_parameters(config))

        conn_pool = pool.QueuePool(cast(Any, get_conn), max_overflow=5, pool_size=10)

        return create_engine(
            "postgresql+psycopg://",
            pool=conn_pool,
            hide_parameters=True,
        )

    def connect(self) -> Connection:
        """Get a new database connection object."""
        return self._engine.connect()

    def engine(self) -> Engine:
        """Get reference to db engine."""
        return self._engine


def get_connection_parameters(config: DBSettings) -> dict[str, Any]:
    """Get parameters for db connection."""
    token = (
        config.password if config.local_env is True else generate_iam_auth_token(config)
    )
    search_path = "public" if config.local_env is True else "app"
    return {
        "host": config.db_host,
        "dbname": config.name,
        "user": config.user,
        "password": token,
        "port": config.port,
        "connect_timeout": 20,
        "sslmode": config.ssl_mode,
        "options": f"-c search_path={search_path}",
    }


def generate_iam_auth_token(config: DBSettings) -> str:
    """Generate IAM auth token."""
    if config.aws_region is None:
        msg = "AWS region needs to be configured for DB IAM auth"
        raise ValueError(msg)
    client = boto3.client("rds", region_name=config.aws_region)
    return client.generate_db_auth_token(
        DBHostname=config.db_host,
        Port=config.port,
        DBUsername=config.user,
        Region=config.aws_region,
    )
