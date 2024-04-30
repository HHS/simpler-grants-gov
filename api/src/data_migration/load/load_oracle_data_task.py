#
# Load data from legacy (Oracle) tables to staging tables.
#

import logging

import src.db.foreign
import src.db.models.staging
import src.task.task
from src.adapters import db

from . import sql

logger = logging.getLogger(__package__)


class LoadOracleDataTask(src.task.task.Task):
    """Task to load data from legacy tables to staging tables."""

    def __init__(self, db_session: db.Session, foreign_tables=None, staging_tables=None):
        super().__init__(db_session)
        if foreign_tables:
            self.foreign_tables = foreign_tables
        else:
            self.foreign_tables = {t.name: t for t in src.db.foreign.metadata.tables.values()}
        if staging_tables:
            self.staging_tables = staging_tables
        else:
            self.staging_tables = {
                t.name: t for t in src.db.models.staging.metadata.tables.values()
            }

    def run_task(self) -> None:
        with self.db_session.begin():
            self.load_data()

    def load_data(self) -> None:
        for table_name in self.foreign_tables:
            self.do_staging_copy(table_name)

    def do_staging_copy(self, table_name: str):
        logger.info("process table", extra={"table": table_name})
        foreign_table = self.foreign_tables[table_name]
        staging_table = self.staging_tables[table_name]

        self.log_row_count("row count before", foreign_table, staging_table)

        insert_count = self.do_insert(foreign_table, staging_table)
        update_count = self.do_update(foreign_table, staging_table)
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

    def do_insert(self, foreign_table, staging_table):
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

    def do_update(self, foreign_table, staging_table):
        """Find updated rows using last_upd_date, copy them, and reset transformed_at to NULL."""

        update_sql = sql.build_update_sql(foreign_table, staging_table).values(transformed_at=None)

        # print(update_sql)
        result = self.db_session.execute(update_sql)

        return result.rowcount

    def do_mark_deleted(self, foreign_table, staging_table):
        """Find deleted rows, set is_deleted=TRUE, and reset transformed_at to NULL."""

        update_sql = sql.build_mark_deleted_sql(foreign_table, staging_table).values(
            transformed_at=None
        )

        # print(update_sql)
        result = self.db_session.execute(update_sql)

        return result.rowcount

    def log_row_count(self, message, *tables):
        extra = {}
        for table in tables:
            extra[f"count.{table.schema}.{table.name}"] = self.db_session.query(table).count()
        logger.info(message, extra=extra, stacklevel=2)


def main():
    import src.logging

    with src.logging.init(__package__):
        db_client = db.PostgresDBClient()

        with db_client.get_session() as db_session:
            LoadOracleDataTask(db_session).run()


if __name__ == "__main__":
    main()
