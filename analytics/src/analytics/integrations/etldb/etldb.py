"""Defines EtlDb as abstraction layer for database connections"""

from enum import Enum
from sqlalchemy import Connection
from analytics.integrations import db

class EtlDb:
    """An abstraction to encapsulate etl database connections"""

    def __init__(self, effective):
        """Constructor"""
        self._db_engine = db.get_db()
        self.effective_date = effective
        self.dateformat = "%Y-%m-%d"

    def __del__(self):
        """Destructor"""
        self.disconnect()

    def connection(self) -> Connection:
        """Gets a connection object from the db engine"""
        return self._db_engine.connect()

    def commit(self, connection) -> None:
        """Commits an open transaction"""
        connection.commit()

    def disconnect(self) -> None:
        """Dispose of db connection"""
        self._db_engine.dispose()


class EtlChangeType(Enum):
    """An enum to describe ETL change types"""
    NONE = 0
    INSERT = 1
    UPDATE = 2
