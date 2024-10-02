#
# Load data from legacy (Oracle) tables to staging tables.
#
import itertools
import logging
import time

import sqlalchemy

import src.db.models.foreign
import src.db.models.staging
import src.logging
import src.task.task
from src.adapters import db
from src.util import datetime_util

from . import sql

logger = logging.getLogger(__name__)

TABLES_TO_LOAD = [
    "topportunity",
    "topportunity_cfda",
    "tsynopsis",
    "tsynopsis_hist",
    "tforecast",
    "tforecast_hist",
    "tapplicanttypes_forecast",
    "tapplicanttypes_forecast_hist",
    "tapplicanttypes_synopsis",
    "tapplicanttypes_synopsis_hist",
    "tfundactcat_forecast",
    "tfundactcat_forecast_hist",
    "tfundactcat_synopsis",
    "tfundactcat_synopsis_hist",
    "tfundinstr_forecast",
    "tfundinstr_forecast_hist",
    "tfundinstr_synopsis",
    "tfundinstr_synopsis_hist",
    # tgroups,  # Want to hold on this until we have permissions
]


class LoadOracleDataTask(src.task.task.Task):
    """Task to load data from legacy tables to staging tables."""

    def __init__(
        self,
        db_session: db.Session,
        foreign_tables: dict[str, sqlalchemy.Table],
        staging_tables: dict[str, sqlalchemy.Table],
        tables_to_load: list[str] | None = None,
        insert_chunk_size: int = 800,
    ) -> None:

        if tables_to_load is None or len(tables_to_load) == 0:
            tables_to_load = TABLES_TO_LOAD

        foreign_tables = {k: v for (k, v) in foreign_tables.items() if k in tables_to_load}
        staging_tables = {k: v for (k, v) in staging_tables.items() if k in tables_to_load}

        if foreign_tables.keys() != staging_tables.keys():
            raise ValueError("keys of foreign_tables and staging_tables must be equal")

        super().__init__(db_session)
        self.foreign_tables = foreign_tables
        self.staging_tables = staging_tables
        self.insert_chunk_size = insert_chunk_size

    def run_task(self) -> None:
        """Main task process, called by run()."""
        with self.db_session.begin():
            self.log_database_settings()
        self.load_data()

    def log_database_settings(self) -> None:
        """Log database settings related to foreign tables for easier troubleshooting."""
        metadata = sqlalchemy.MetaData()
        engine = self.db_session.bind

        # Use reflection to define built-in views as Table objects.
        foreign_servers = sqlalchemy.Table(
            "foreign_servers", metadata, autoload_with=engine, schema="information_schema"
        )
        foreign_server_options = sqlalchemy.Table(
            "foreign_server_options", metadata, autoload_with=engine, schema="information_schema"
        )

        logger.info(
            "foreign server settings",
            extra={
                "foreign_servers": self.db_session.execute(
                    sqlalchemy.select(foreign_servers)
                ).all(),
                "foreign_server_options": self.db_session.execute(
                    sqlalchemy.select(foreign_server_options)
                ).all(),
            },
        )

    def load_data(self) -> None:
        """Load the data for all tables defined in the mapping."""
        for table_name in self.foreign_tables:
            try:
                self.load_data_for_table(table_name)
            except Exception:
                logger.exception("table load error", extra={"table": table_name})

    def load_data_for_table(self, table_name: str) -> None:
        """Load new and updated rows for a single table from the foreign table to the staging table."""
        logger.info("process table", extra={"table": table_name})
        foreign_table = self.foreign_tables[table_name]
        staging_table = self.staging_tables[table_name]

        self.log_row_count("before", foreign_table, staging_table)

        self.do_update(foreign_table, staging_table)
        self.do_insert(foreign_table, staging_table)
        self.do_mark_deleted(foreign_table, staging_table)

        self.log_row_count("after", staging_table)

    def do_insert(self, foreign_table: sqlalchemy.Table, staging_table: sqlalchemy.Table) -> int:
        """Determine new rows by primary key, and copy them into the staging table."""
        log_extra = {"table": foreign_table.name}

        logger.info("Fetching records to be inserted", extra=log_extra)
        select_sql = sql.build_select_new_rows_sql(foreign_table, staging_table)
        with self.db_session.begin():
            new_ids = self.db_session.execute(select_sql).all()

        t0 = time.monotonic()
        insert_chunk_count = []
        logger.info("Fetched records to be inserted, beginning batches", extra=log_extra)
        for batch_of_new_ids in itertools.batched(new_ids, self.insert_chunk_size):
            insert_from_select_sql = sql.build_insert_select_sql(
                foreign_table, staging_table, batch_of_new_ids
            )

            # Execute the INSERT.
            with self.db_session.begin():
                self.db_session.execute(insert_from_select_sql)

            insert_chunk_count.append(len(batch_of_new_ids))
            logger.info(
                "insert chunk done",
                extra=log_extra
                | {
                    "count": sum(insert_chunk_count),
                    "total": len(new_ids),
                },
            )

        t1 = time.monotonic()
        total_insert_count = sum(insert_chunk_count)
        self.increment("count.insert.total", total_insert_count)
        self.increment(f"count.insert.{staging_table.name}", total_insert_count)
        self.set_metrics(
            {
                f"count.insert.chunk.{staging_table.name}": ",".join(map(str, insert_chunk_count)),
                f"time.insert.{staging_table.name}": round(t1 - t0, 3),
            }
        )

        return total_insert_count

    def do_update(self, foreign_table: sqlalchemy.Table, staging_table: sqlalchemy.Table) -> int:
        """Find updated rows using last_upd_date, copy them, and reset transformed_at to NULL."""
        log_extra = {"table": foreign_table.name}

        logger.info("Fetching records to be updated", extra=log_extra)
        select_sql = sql.build_select_updated_rows_sql(foreign_table, staging_table)
        with self.db_session.begin():
            update_ids = self.db_session.execute(select_sql).all()

        t0 = time.monotonic()
        update_chunk_count = []
        logger.info("Fetched records to be updated, beginning batches", extra=log_extra)
        for batch_of_update_ids in itertools.batched(update_ids, self.insert_chunk_size):
            update_sql = sql.build_update_sql(
                foreign_table, staging_table, batch_of_update_ids
            ).values(transformed_at=None)

            with self.db_session.begin():
                self.db_session.execute(update_sql)

            update_chunk_count.append(len(batch_of_update_ids))
            logger.info(
                "update chunk done",
                extra=log_extra | {"count": sum(update_chunk_count), "total": len(update_ids)},
            )

        t1 = time.monotonic()
        total_update_count = sum(update_chunk_count)
        self.increment("count.update.total", total_update_count)
        self.increment(f"count.update.{staging_table.name}", total_update_count)
        self.set_metrics(
            {
                f"count.update.chunk.{staging_table.name}": ",".join(map(str, update_chunk_count)),
                f"time.update.{staging_table.name}": round(t1 - t0, 3),
            }
        )

        return total_update_count

    def do_mark_deleted(
        self, foreign_table: sqlalchemy.Table, staging_table: sqlalchemy.Table
    ) -> int:
        """Find deleted rows, set is_deleted=TRUE, and reset transformed_at to NULL."""
        log_extra = {"table": foreign_table.name}

        logger.info("Fetching records to be deleted", extra=log_extra)
        update_sql = sql.build_mark_deleted_sql(foreign_table, staging_table).values(
            transformed_at=None,
            deleted_at=datetime_util.utcnow(),
        )

        t0 = time.monotonic()
        logger.info("Fetched records to be deleted", extra=log_extra)
        with self.db_session.begin():
            result = self.db_session.execute(update_sql)
        t1 = time.monotonic()
        delete_count = result.rowcount

        self.increment("count.delete.total", delete_count)
        self.set_metrics({f"count.delete.{staging_table.name}": delete_count})
        self.set_metrics({f"time.delete.{staging_table.name}": round(t1 - t0, 3)})
        logger.info("Delete done", extra=log_extra | {"count": delete_count})

        return delete_count

    def log_row_count(self, message: str, *tables: sqlalchemy.Table) -> None:
        """Log the number of rows in each of the tables using SQL COUNT()."""
        extra: dict = {}
        with self.db_session.begin():
            for table in tables:
                count = self.db_session.query(table).count()
                extra["table"] = table.name
                extra[f"count.{table.schema}.{table.name}"] = count
                self.set_metrics({f"count.{message}.{table.schema}.{table.name}": count})
        logger.info(f"row count {message}", extra=extra, stacklevel=2)


def main() -> None:
    with src.logging.init(__package__):
        db_client = db.PostgresDBClient()

        foreign_tables = {t.name: t for t in src.db.models.foreign.metadata.tables.values()}
        staging_tables = {t.name: t for t in src.db.models.staging.metadata.tables.values()}

        with db_client.get_session() as db_session:
            LoadOracleDataTask(db_session, foreign_tables, staging_tables).run()


if __name__ == "__main__":
    main()
