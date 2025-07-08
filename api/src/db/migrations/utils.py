from typing import Protocol

from src.db.migrations.constants import opportunity_search_index_queue_trigger_function


class OpExecutable(Protocol):
    def execute(self, statement: str) -> None: ...


def setup_opportunity_search_index_queue_trigger_function(
    op: OpExecutable, tables: list[str]
) -> None:
    # Setup the opportunity search index queue trigger function
    op.execute(opportunity_search_index_queue_trigger_function)

    # Create triggers for each table
    for table in tables:
        op.execute(
            f"""
            CREATE OR REPLACE TRIGGER {table}_queue_trigger
            AFTER INSERT OR UPDATE ON api.{table}
            FOR EACH ROW EXECUTE FUNCTION api.update_opportunity_search_queue();
        """
        )


def remove_opportunity_search_index_queue_trigger_function(
    op: OpExecutable, tables: list[str]
) -> None:
    # Drop triggers
    for table in tables:
        op.execute(f"DROP TRIGGER IF EXISTS {table}_queue_trigger ON api.{table};")

    # Drop the trigger function
    op.execute("DROP FUNCTION IF EXISTS api.update_opportunity_search_queue();")
