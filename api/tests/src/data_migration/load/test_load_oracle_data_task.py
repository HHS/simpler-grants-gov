#
# Unit tests for src.data_migration.load.load_oracle_data_task.
#

import datetime

import freezegun
import pytest
import sqlalchemy

from src.data_migration.load import load_oracle_data_task


@pytest.fixture(scope="module")
def sqlalchemy_metadata():
    return sqlalchemy.MetaData()


@pytest.fixture(scope="module")
def source_table(sqlalchemy_metadata):
    return sqlalchemy.Table(
        "test_source_table",
        sqlalchemy_metadata,
        sqlalchemy.Column("id1", sqlalchemy.Integer, primary_key=True),
        sqlalchemy.Column("id2", sqlalchemy.Integer, primary_key=True),
        sqlalchemy.Column("x", sqlalchemy.Text),
        sqlalchemy.Column("last_upd_date", sqlalchemy.TIMESTAMP),
    )


@pytest.fixture(scope="module")
def destination_table(sqlalchemy_metadata):
    return sqlalchemy.Table(
        "test_destination_table",
        sqlalchemy_metadata,
        sqlalchemy.Column("id1", sqlalchemy.Integer, primary_key=True),
        sqlalchemy.Column("id2", sqlalchemy.Integer, primary_key=True),
        sqlalchemy.Column("x", sqlalchemy.Text),
        sqlalchemy.Column("last_upd_date", sqlalchemy.TIMESTAMP),
        sqlalchemy.Column("is_deleted", sqlalchemy.Boolean),
        sqlalchemy.Column("transformed_at", sqlalchemy.TIMESTAMP),
        sqlalchemy.Column("deleted_at", sqlalchemy.TIMESTAMP),
    )


@pytest.fixture(scope="module")
def create_tables(db_client, sqlalchemy_metadata, source_table, destination_table):
    with db_client.get_connection() as conn, conn.begin():
        sqlalchemy_metadata.create_all(bind=conn)
    yield
    with db_client.get_connection() as conn, conn.begin():
        sqlalchemy_metadata.drop_all(bind=conn)


@freezegun.freeze_time()
def test_load_data(db_session, source_table, destination_table, create_tables):
    time1 = datetime.datetime(2024, 1, 20, 7, 15, 0)
    time2 = datetime.datetime(2024, 1, 20, 7, 15, 1)
    time3 = datetime.datetime(2024, 4, 10, 22, 0, 1)
    now = datetime.datetime.now()

    db_session.execute(
        sqlalchemy.insert(source_table).values(
            [
                # inserts:
                (1, 2, "a+", time1),
                (1, 3, "b+", time1),
                # unchanged:
                (2, 1, "c+", time1),
                # update:
                (3, 4, "d+", time2),
            ]
        )
    )
    db_session.execute(
        sqlalchemy.insert(destination_table).values(
            [
                # unchanged:
                (2, 1, "c", time1, False, time3),
                # update:
                (3, 4, "d", time1, False, time3),
                # delete:
                (4, 2, "e", time1, False, time3),
            ]
        )
    )

    task = load_oracle_data_task.LoadOracleDataTask(
        db_session, {"table1": source_table}, {"table1": destination_table}
    )
    task.load_data()

    assert db_session.query(source_table).count() == 4
    assert db_session.query(destination_table).count() == 5

    assert tuple(
        db_session.execute(
            sqlalchemy.select(destination_table).order_by(
                destination_table.c.id1, destination_table.c.id2
            )
        )
    ) == (
        (1, 2, "a+", time1, False, None, None),
        (1, 3, "b+", time1, False, None, None),
        (2, 1, "c", time1, False, time3, None),
        (3, 4, "d+", time2, False, None, None),
        (4, 2, "e", time1, True, None, now),
    )
