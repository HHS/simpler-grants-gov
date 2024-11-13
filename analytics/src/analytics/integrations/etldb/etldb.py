"""Define EtlDb as an abstraction layer for database connections."""

from enum import Enum

from sqlalchemy import Connection

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


class EtlChangeType(Enum):
    """An enum to describe ETL change types."""

    NONE = 0
    INSERT = 1
    UPDATE = 2
