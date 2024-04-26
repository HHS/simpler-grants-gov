#
# Load data from legacy (Oracle) tables to staging tables.
#

import logging

import src.task.task
from src.adapters.db import PostgresDBClient

logger = logging.getLogger(__name__)


class LoadOracleDataTask(src.task.task.Task):
    def run_task(self) -> None:
        with self.db_session.begin():
            self.load_data()

    def load_data(self) -> None:
        pass


def main():
    import src.logging

    with src.logging.init(__name__):
        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            LoadOracleDataTask(db_session).run()


if __name__ == "__main__":
    main()
