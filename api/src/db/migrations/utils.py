from alembic.operations import Operations
from src.db.migrations.constants import opportunity_search_index_queue_trigger_function


def setup_opportunity_search_index_queue_trigger_function(op: Operations, tables: list[str]):
    # Setup the opportunity search index queue trigger function
    op.execute(opportunity_search_index_queue_trigger_function)

    # Create triggers for each table
    for table in tables:
        op.execute(
            f"""
            CREATE TRIGGER {table}_queue_trigger
            AFTER INSERT OR UPDATE ON api.{table}
            FOR EACH ROW EXECUTE FUNCTION update_opportunity_search_queue();
        """
        )


def remove_opportunity_search_index_queue_trigger_function(op: Operations, tables: list[str]):
    # Drop triggers
    for table in tables:
        op.execute(f"DROP TRIGGER IF EXISTS {table}_queue_trigger ON api.{table};")

    # Drop the trigger function
    op.execute("DROP FUNCTION IF EXISTS update_opportunity_search_queue();")
