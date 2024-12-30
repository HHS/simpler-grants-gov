import click

import src.adapters.db as db
import src.adapters.search as search
from src.adapters.db import flask_db
from src.adapters.search import flask_opensearch
from src.search.backend.load_opportunities_to_index import LoadOpportunitiesToIndex
from src.search.backend.load_search_data_blueprint import load_search_data_blueprint
from src.task.ecs_background_task import ecs_background_task
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from opensearchpy.exceptions import ConnectionTimeout, TransportError


@load_search_data_blueprint.cli.command(
    "load-opportunity-data", help="Load opportunity data from our database to the search index"
)
@click.option(
    "--full-refresh/--incremental",
    default=True,
    help="Whether to run a full refresh, or only incrementally update oppportunities",
)
@flask_db.with_db_session()
@flask_opensearch.with_search_client()
@ecs_background_task(task_name="load-opportunity-data-opensearch")
@retry(
    stop=stop_after_attempt(3),  # Retry up to 3 times
    wait=wait_fixed(2),  # Wait 2 seconds between retries
    retry=retry_if_exception_type((TransportError, ConnectionTimeout)),  # Retry on TransportError (including timeouts)
)
def load_opportunity_data(
    search_client: search.SearchClient, db_session: db.Session, full_refresh: bool
) -> None:
    LoadOpportunitiesToIndex(db_session, search_client, full_refresh).run()
