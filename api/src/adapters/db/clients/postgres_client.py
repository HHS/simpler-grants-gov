import logging
from typing import Any

import boto3
import psycopg2
import sqlalchemy
import sqlalchemy.pool as pool

from src.adapters.db.client import DBClient
from src.adapters.db.clients.postgres_config import PostgresDBConfig, get_db_config

logger = logging.getLogger(__name__)


class PostgresDBClient(DBClient):
    """
    An implementation of a DBClient for connecting to a Postgres DB
    as configured by parameters passed in from the db_config
    """

    def __init__(self, db_config: PostgresDBConfig | None = None) -> None:
        if not db_config:
            db_config = get_db_config()
        self._engine = self._configure_engine(db_config)

        if db_config.check_connection_on_init:
            self.check_db_connection()

    def _configure_engine(self, db_config: PostgresDBConfig) -> sqlalchemy.engine.Engine:
        # We want to be able to control the connection parameters for each
        # connection because for IAM authentication with RDS, short-lived tokens are
        # used as the password, and so we potentially need to generate a fresh token
        # for each connection.
        #
        # For more details on building connection pools, see the docs:
        # https://docs.sqlalchemy.org/en/13/core/pooling.html#constructing-a-pool
        def get_conn() -> Any:
            return psycopg2.connect(**get_connection_parameters(db_config))

        conn_pool = pool.QueuePool(get_conn, max_overflow=10, pool_size=20)

        # The URL only needs to specify the dialect, since the connection pool
        # handles the actual connections.
        #
        # (a SQLAlchemy Engine represents a Dialect+Pool)
        return sqlalchemy.create_engine(
            "postgresql://",
            pool=conn_pool,
            # FYI, execute many mode handles how SQLAlchemy handles doing a bunch of inserts/updates/deletes at once
            # https://docs.sqlalchemy.org/en/14/dialects/postgresql.html#psycopg2-fast-execution-helpers
            executemany_mode="batch",
            hide_parameters=db_config.hide_sql_parameter_logs,
            # TODO: Don't think we need this as we aren't using JSON columns, but keeping for reference
            # json_serializer=lambda o: json.dumps(o, default=pydantic.json.pydantic_encoder),
        )

    def check_db_connection(self) -> None:
        with self.get_connection() as conn:
            conn_info = conn.connection.dbapi_connection.info  # type: ignore

            logger.info(
                "connected to postgres db",
                extra={
                    "dbname": conn_info.dbname,
                    "user": conn_info.user,
                    "host": conn_info.host,
                    "port": conn_info.port,
                    "options": conn_info.options,
                    "dsn_parameters": conn_info.dsn_parameters,
                    "protocol_version": conn_info.protocol_version,
                    "server_version": conn_info.server_version,
                },
            )
            verify_ssl(conn_info)

            # TODO add check_migrations_current to config
            # if check_migrations_current:
            #     have_all_migrations_run(engine)


def get_connection_parameters(db_config: PostgresDBConfig) -> dict[str, Any]:
    connect_args: dict[str, Any] = {}

    if db_config.password is None:
        assert (
            db_config.aws_region is not None
        ), "AWS region needs to be configured for DB IAM auth if DB password is not configured"
        password = generate_iam_auth_token(
            db_config.aws_region, db_config.host, db_config.port, db_config.username
        )
    else:
        password = db_config.password

    return dict(
        host=db_config.host,
        dbname=db_config.name,
        user=db_config.username,
        password=password,
        port=db_config.port,
        options=f"-c search_path={db_config.db_schema}",
        connect_timeout=10,
        sslmode=db_config.ssl_mode,
        **connect_args,
    )


def generate_iam_auth_token(aws_region: str, host: str, port: int, user: str) -> str:
    logger.info(
        "generating db iam auth token",
        extra={
            "aws_region": aws_region,
            "user": user,
            "host": host,
            "port": port,
        },
    )
    client = boto3.client("rds", region_name=aws_region)
    token = client.generate_db_auth_token(
        DBHostname=host, Port=port, DBUsername=user, Region=aws_region
    )
    return token


def verify_ssl(connection_info: Any) -> None:
    """Verify that the database connection is encrypted and log a warning if not."""
    if connection_info.ssl_in_use:
        logger.info(
            "database connection is using SSL: %s",
            ", ".join(
                name + " " + connection_info.ssl_attribute(name)
                for name in connection_info.ssl_attribute_names
            ),
        )
    else:
        logger.warning("database connection is not using SSL")
