"""Define EtlDb as an abstraction layer for database connections"""

from enum import Enum
from sqlalchemy import Connection
from analytics.integrations import db


class EtlDb:
    """Encapsulate etl database connections"""

    def __init__(self, effective: str | None = None):
        """Construct instance"""
        self._db_engine = db.get_db()
        self.effective_date = effective
        self.dateformat = "%Y-%m-%d"

    def __del__(self):
        """Destroy instance"""
        self.disconnect()

    def connection(self) -> Connection:
        """Get a connection object from the db engine"""
        return self._db_engine.connect()

    def commit(self, connection: Connection) -> None:
        """Commit an open transaction"""
        connection.commit()

    def disconnect(self) -> None:
        """Dispose of db connection"""
        self._db_engine.dispose()


class EtlChangeType(Enum):
    """An enum to describe ETL change types"""

    NONE = 0
    INSERT = 1
    UPDATE = 2
