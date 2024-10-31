from enum import Enum
from sqlalchemy import Connection
from analytics.integrations import db

class EtlDb:
    """An abstraction to encapsulate db connection."""

    def __init__(self, effective):
        self._db_engine = db.get_db()
        self.effective_date = effective

    def __del__(self):
        self.disconnect()

    def connection(self) -> Connection:
        return self._db_engine.connect()

    def commit(self, connection) -> None:
        connection.commit()

    def disconnect(self) -> None:
        self._db_engine.dispose()


class EtlChangeType(Enum):
    """An enum to describe ETL change types"""
    NONE = 0
    INSERT = 1
    UPDATE = 2
