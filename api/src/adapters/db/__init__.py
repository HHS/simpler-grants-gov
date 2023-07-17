"""
Database module.

This module contains the DBClient class, which is used to manage database connections.
This module can be used on it's own or with an application framework such as Flask.

To use this module with Flask, use the flask_db module.

Usage:
    import src.adapters.db as db

    db_client = db.PostgresDBClient()

    # non-ORM style usage
    with db_client.get_connection() as conn:
        conn.execute(...)

    # ORM style usage
    with db_client.get_session() as session:
        session.query(...)
        with session.begin():
            session.add(...)
"""

# Re-export for convenience
from src.adapters.db.client import Connection, DBClient, Session
from src.adapters.db.clients.postgres_client import PostgresDBClient

# Do not import flask_db here, because this module is not dependent on any specific framework.
# Code can choose to use this module on its own or with the flask_db module depending on needs.

__all__ = ["Connection", "DBClient", "Session", "PostgresDBClient"]
