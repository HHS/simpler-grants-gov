#
# Load data from legacy (Oracle) tables to staging tables.
#

# TODO remove this line (trigger GH Action)

import logging

import sqlalchemy

import src.db.foreign
import src.db.models.staging
import src.logging
import src.task.task
from src.adapters import db
from src.util import datetime_util

from . import sql

logger = logging.getLogger(__package__)


class LoadOracleDataTask(src.task.task.Task):
    """Task to load data from legacy tables to staging tables."""

    def __init__(
        self,
        db_session: db.Session,
        foreign_tables: dict[str, sqlalchemy.Table],
        staging_tables: dict[str, sqlalchemy.Table],
    ) -> None:
        super().__init__(db_session)
        self.foreign_tables = foreign_tables
        self.staging_tables = staging_tables

    def run_task(self) -> None:
        with self.db_session.begin():
            self.log_database_settings()
            self.load_data()

    def log_database_settings(self) -> None:
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
        for table_name in self.foreign_tables:
            try:
                self.load_data_for_table(table_name)
            except Exception:
                logger.exception("table load error")

    def load_data_for_table(self, table_name: str) -> None:
        logger.info("process table", extra={"table": table_name})
        foreign_table = self.foreign_tables[table_name]
        staging_table = self.staging_tables[table_name]

        self.log_row_count("row count before", foreign_table, staging_table)

        update_count = self.do_update(foreign_table, staging_table)
        insert_count = self.do_insert(foreign_table, staging_table)
        delete_count = self.do_mark_deleted(foreign_table, staging_table)
        logger.info(
            "load count",
            extra={
                "table": table_name,
                "count.insert": insert_count,
                "count.update": update_count,
                "count.delete": delete_count,
            },
        )
        self.set_metrics(
            {
                f"count.insert.{table_name}": insert_count,
                f"count.update.{table_name}": update_count,
                f"count.delete.{table_name}": delete_count,
            }
        )
        self.increment("count.insert.total", insert_count)
        self.increment("count.update.total", update_count)
        self.increment("count.delete.total", delete_count)

        self.log_row_count("row count after", foreign_table, staging_table)

    def do_insert(self, foreign_table: sqlalchemy.Table, staging_table: sqlalchemy.Table) -> int:
        """Determine new rows by primary key, and copy them into the staging table."""

        insert_from_select_sql, select_sql = sql.build_insert_select_sql(
            foreign_table, staging_table
        )

        # print(insert_from_select_sql)

        # COUNT has to be a separate query as INSERTs don't return a rowcount.
        insert_count = self.db_session.query(select_sql.subquery()).count()
        # Execute the INSERT.
        self.db_session.execute(insert_from_select_sql)

        return insert_count

    def do_update(self, foreign_table: sqlalchemy.Table, staging_table: sqlalchemy.Table) -> int:
        """Find updated rows using last_upd_date, copy them, and reset transformed_at to NULL."""

        update_sql = sql.build_update_sql(foreign_table, staging_table).values(transformed_at=None)

        # print(update_sql)
        result = self.db_session.execute(update_sql)

        return result.rowcount

    def do_mark_deleted(
        self, foreign_table: sqlalchemy.Table, staging_table: sqlalchemy.Table
    ) -> int:
        """Find deleted rows, set is_deleted=TRUE, and reset transformed_at to NULL."""

        update_sql = sql.build_mark_deleted_sql(foreign_table, staging_table).values(
            transformed_at=None,
            deleted_at=datetime_util.utcnow(),
        )

        # print(update_sql)
        result = self.db_session.execute(update_sql)

        return result.rowcount

    def log_row_count(self, message: str, *tables: sqlalchemy.Table) -> None:
        extra = {}
        for table in tables:
            extra[f"count.{table.schema}.{table.name}"] = self.db_session.query(table).count()
        logger.info(message, extra=extra, stacklevel=2)


def main() -> None:
    with src.logging.init(__package__):
        db_client = db.PostgresDBClient()

        foreign_tables = {t.name: t for t in src.db.foreign.metadata.tables.values()}
        staging_tables = {t.name: t for t in src.db.models.staging.metadata.tables.values()}

        with db_client.get_session() as db_session:
            LoadOracleDataTask(db_session, foreign_tables, staging_tables).run()


if __name__ == "__main__":
    main()
