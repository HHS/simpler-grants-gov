from sqlalchemy import create_engine, text

from analytics.integrations.etldb.etldb import EtlDb
from src.adapters.db import flask_db


# Function that Fetch data from source db
def _fetch_data(source_db_sesison, source_schema, source_table):
    with source_db_sesison.begin():
        result = source_db_sesison.execute(text(f"SELECT * FROM {source_schema}.{source_table}"))
        data = [dict(row) for row in result]
        return data

# Function that Insert data into target db
def _insert_data(target_db_session, data, target_schema, target_table):
    with target_db_session.begin():
        for row in data:
            target_db_session.execute(
                text(f"INSERT INTO {target_schema}.{target_table} (col1, col2) VALUES (:col1, :col2)"),
                **row,
            )

@flask_db.with_db_session()
def copy_data_from_grants_db_to_analytics_db(db_session):
    # Source and target database connections
    grants_db_session = db_session
    analytics_db_session  = EtlDb().connection()

    tables = []

    for table in tables:
        data = _fetch_data(table)
        _insert_data=(data)




