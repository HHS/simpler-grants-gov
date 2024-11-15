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

    def get_schema_version(self) -> int:
        """Select schema version from etl database."""
        version = 0

        if self.schema_versioning_exists():
            result = self.connection().execute(
                text("select version from schema_version"),
            )
            row = result.fetchone()
            if row:
                version = row[0]

        return version

    def set_schema_version(self, new_value: int, auto_commit: bool = True) -> None:
        """Set schema version number."""
        if not self.schema_versioning_exists():
            return

        # sanity check new version number
        current_version = self.get_schema_version()
        if new_value < current_version:
            message = (
                "WARNING: cannot bump schema version "
                f"from {current_version} to {new_value}"
            )
            print(message)
            return

        if new_value > current_version:
            cursor = self.connection()
            cursor.execute(
                text(
                    "insert into schema_version (version) values (:new_value) "
                    "on conflict(one_row) do update "
                    "set version = :new_value"
                ),
                {"new_value": new_value},
            )
            if auto_commit:
                self.commit(cursor)

    def schema_versioning_exists(self) -> bool:
        """Determine whether schema version table exists."""
        result = self.connection().execute(
            text(
                "select table_name from information_schema.tables "
                "where table_name = 'schema_version'",
            ),
        )
        row = result.fetchone()
        return True if row and row[0] == "schema_version" else False


class EtlChangeType(Enum):
    """An enum to describe ETL change types."""

    NONE = 0
    INSERT = 1
    UPDATE = 2
