"""Define EtlDb as an abstraction layer for database connections."""

from enum import Enum

from sqlalchemy import Connection, text

from analytics.integrations.db import PostgresDbClient


class EtlDb:
    """Encapsulate etl database connections."""

    def __init__(self, effective: str | None = None) -> None:
        """Construct instance."""
        try:
            self._db_client = PostgresDbClient()
        except RuntimeError as e:
            message = f"Failed to instantiate database engine: {e}"
            raise RuntimeError(message) from e

        self._connection: Connection | None = None
        self.effective_date = effective
        self.dateformat = "%Y-%m-%d"

    def connection(self) -> Connection:
        """Get a connection object from the database engine."""
        if self._connection is None:
            try:
                self._connection = self._db_client.connect()
            except RuntimeError as e:
                message = f"Failed to connect to database: {e}"
                raise RuntimeError(message) from e
        return self._connection

    def commit(self, connection: Connection) -> None:
        """Commit an open transaction."""
        connection.commit()

    def schema_version(self) -> int:
        """Select schema version from etl database."""
        version = 1
        cursor = self.connection()

        result1 = cursor.execute(
            text(
                "select table_name from information_schema.tables "
                "where table_name = 'gh_schema_version'",
            ),
        )
        row1 = result1.fetchone()

        if row1 and row1[0] == "gh_schema_version":
            result2 = cursor.execute(
                text("select max(version) from gh_schema_version"),
            )
            row2 = result2.fetchone()
            if row2:
                version = row2[0]

        return version


class EtlChangeType(Enum):
    """An enum to describe ETL change types."""

    NONE = 0
    INSERT = 1
    UPDATE = 2
