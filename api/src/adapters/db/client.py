"""
This module contains the DBClient class, which is used to manage database connections

For usage information look at the package docstring in __init__.py
"""
import abc
import logging

import sqlalchemy
from sqlalchemy.orm import session

# Re-export the Connection type that is returned by the get_connection() method
# to be used for type hints.
Connection = sqlalchemy.engine.Connection

# Re-export the Session type that is returned by the get_session() method
# to be used for type hints.
Session = session.Session

logger = logging.getLogger(__name__)


class DBClient(abc.ABC, metaclass=abc.ABCMeta):
    """Database connection manager.

    This class is used to manage database connections for the Flask app.
    It has methods for getting a new connection or session object.

    A derived class must initialize _engine in the __init__ function
    """

    _engine: sqlalchemy.engine.Engine

    @abc.abstractmethod
    def check_db_connection(self) -> None:
        raise NotImplementedError()

    def get_connection(self) -> Connection:
        """Return a new database connection object.

        Use the connection to execute SQL queries without using the ORM.

        Usage:
            with db.get_connection() as conn:
                conn.execute(...)
        """
        return self._engine.connect()

    def get_session(self) -> Session:
        """Return a new session object.

        In general, only one session object should be created per request.

        If you want to automatically commit or rollback the session, use
        the session.begin() context manager.
        See https://docs.sqlalchemy.org/en/13/orm/session_basics.html#when-do-i-construct-a-session-when-do-i-commit-it-and-when-do-i-close-it

        Example:
            with db.get_session() as session:
                with session.begin():
                    session.add(...)
                # session is automatically committed here
                # or rolled back if an exception is raised
        """
        return Session(bind=self._engine, expire_on_commit=False, autocommit=False)
