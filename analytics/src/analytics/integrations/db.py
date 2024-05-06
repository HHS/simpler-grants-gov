# pylint: disable=invalid-name
"""Manage connection to the database using a SQLAlchemy session factory."""

from typing import Generator

from sqlalchemy import create_engine, Engine
# from sqlalchemy.orm import Session, sessionmaker



def get_db(database_url:str) -> Engine:
    """
    #To be updated: Yield a connection to the database to manage transactions.

    Yields
    ------
    Session
        A SQLAlechemy session that manages a connection to the database

    """
    engine = create_engine("sqlite:///mock.db", pool_pre_ping=True)

   
