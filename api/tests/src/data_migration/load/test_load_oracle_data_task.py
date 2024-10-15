#
# Unit tests for src.data_migration.load.load_oracle_data_task.
#

import datetime

import freezegun
import pytest
import sqlalchemy

import src.db.models.foreign
import src.db.models.staging
from src.data_migration.load import load_oracle_data_task
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import ForeignTopportunityFactory, StagingTopportunityFactory


def validate_copied_value(
    source_table,
    source_record,
    destination_record,
    is_delete: bool = False,
    is_unmodified: bool = False,
):
    if is_delete:
        assert destination_record.is_deleted is True
        assert destination_record.transformed_at is None
        assert destination_record.deleted_at is not None
        return

    mismatches = []

    for column_name in source_table.c.keys():
        source_value = getattr(source_record, column_name)
        destination_value = getattr(destination_record, column_name)

        if source_value != destination_value:
            mismatches.append(f"{column_name}: {source_value} != {destination_value}")

    if is_unmodified:
        assert (
            len(mismatches) > 0
        ), "Expected no update on destination record, but had some: " + str(mismatches)

    else:
        assert (
            len(mismatches) == 0
        ), "Expected updates on destination record, but did not match " + str(mismatches)


class TestLoadOracleData(BaseTestClass):

    @pytest.fixture(scope="class")
    def foreign_tables(self):
        return {t.name: t for t in src.db.models.foreign.metadata.tables.values()}

    @pytest.fixture(scope="class")
    def staging_tables(self):
        return {t.name: t for t in src.db.models.staging.metadata.tables.values()}

    def test_load_data(self, db_session, foreign_tables, staging_tables, enable_factory_create):
        time1 = datetime.datetime(2024, 1, 20, 7, 15, 0)
        time2 = datetime.datetime(2024, 1, 20, 7, 15, 1)
        time3 = datetime.datetime(2024, 4, 10, 22, 0, 1)

        source_table = foreign_tables["topportunity"]
        destination_table = staging_tables["topportunity"]

        db_session.execute(sqlalchemy.delete(source_table))
        db_session.execute(sqlalchemy.delete(destination_table))

        ## Source records
        # inserts:
        source_record1 = ForeignTopportunityFactory.create(
            opportunity_id=1, oppnumber="A-1", cfdas=[], last_upd_date=time3
        )
        source_record2 = ForeignTopportunityFactory.create(
            opportunity_id=2, oppnumber="A-2", cfdas=[], last_upd_date=time3
        )
        # unchanged:
        source_record3 = ForeignTopportunityFactory.create(
            opportunity_id=3, oppnumber="A-3", cfdas=[], last_upd_date=time3
        )
        # update:
        source_record4 = ForeignTopportunityFactory.create(
            opportunity_id=4, oppnumber="A-4-update", cfdas=[], last_upd_date=time3
        )
        source_record5 = ForeignTopportunityFactory.create(
            opportunity_id=6, oppnumber="A-6-update", cfdas=[], last_upd_date=time3
        )

        ## Destination records
        # unchanged:
        StagingTopportunityFactory.create(
            opportunity_id=3, oppnumber="A-3", cfdas=[], last_upd_date=time3
        )
        # update:
        StagingTopportunityFactory.create(
            opportunity_id=4, oppnumber="A-4", cfdas=[], last_upd_date=time1
        )
        StagingTopportunityFactory.create(
            opportunity_id=6, oppnumber="A-6", cfdas=[], last_upd_date=None
        )
        # delete:
        StagingTopportunityFactory.create(
            opportunity_id=5, oppnumber="A-5", cfdas=[], last_upd_date=time2
        )

        task = load_oracle_data_task.LoadOracleDataTask(
            db_session, foreign_tables, staging_tables, ["topportunity"]
        )
        task.run()

        # Force the data to be fetched from the DB and not a cache
        # this prevents some weirdness with the value comparison we'll do
        db_session.expire_all()

        assert db_session.query(source_table).count() == 5
        assert db_session.query(destination_table).count() == 6

        destination_records = (
            db_session.query(destination_table).order_by(destination_table.c.opportunity_id).all()
        )

        validate_copied_value(source_table, source_record1, destination_records[0])
        validate_copied_value(source_table, source_record2, destination_records[1])
        validate_copied_value(
            source_table, source_record3, destination_records[2], is_unmodified=True
        )
        validate_copied_value(source_table, source_record4, destination_records[3])
        validate_copied_value(source_table, None, destination_records[4], is_delete=True)
        validate_copied_value(source_table, source_record5, destination_records[5])

        assert task.metrics["count.delete.topportunity"] == 1
        assert task.metrics["count.insert.topportunity"] == 2
        assert task.metrics["count.update.topportunity"] == 2
        assert task.metrics["count.delete.total"] == 1
        assert task.metrics["count.insert.total"] == 2
        assert task.metrics["count.update.total"] == 2

    def test_raises_if_table_dicts_different(self, db_session, foreign_tables, staging_tables):
        with pytest.raises(
            ValueError, match="keys of foreign_tables and staging_tables must be equal"
        ):
            load_oracle_data_task.LoadOracleDataTask(
                db_session, foreign_tables, {}, ["topportunity"]
            )

    @freezegun.freeze_time()
    def test_load_data_chunked(
        self, db_session, foreign_tables, staging_tables, enable_factory_create
    ):
        time1 = datetime.datetime(2024, 1, 20, 7, 15, 0)

        source_table = foreign_tables["topportunity"]
        destination_table = staging_tables["topportunity"]

        db_session.execute(sqlalchemy.delete(source_table))
        db_session.execute(sqlalchemy.delete(destination_table))

        source_records = ForeignTopportunityFactory.create_batch(
            size=100, last_upd_date=time1, cfdas=[]
        )

        task = load_oracle_data_task.LoadOracleDataTask(
            db_session, foreign_tables, staging_tables, ["topportunity"], insert_chunk_size=30
        )
        task.run()

        assert db_session.query(source_table).count() == 100
        assert db_session.query(destination_table).count() == 100

        assert set(
            db_session.scalars(sqlalchemy.select(destination_table.c.opportunity_id))
        ) == set([record.opportunity_id for record in source_records])

        assert task.metrics["count.delete.topportunity"] == 0
        assert task.metrics["count.insert.topportunity"] == 100
        assert task.metrics["count.insert.chunk.topportunity"] == "30,30,30,10"
        assert task.metrics["count.update.topportunity"] == 0
        assert task.metrics["count.delete.total"] == 0
        assert task.metrics["count.insert.total"] == 100
        assert task.metrics["count.update.total"] == 0
