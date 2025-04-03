import click

import src.adapters.db as db
import src.adapters.search as search
from src.adapters.db import flask_db
from src.adapters.search import flask_opensearch
from src.search.backend.load_agencies_to_index import LoadAgenciesToIndex
from src.search.backend.load_opportunities_to_index import LoadOpportunitiesToIndex
from src.search.backend.load_search_data_blueprint import load_search_data_blueprint
from src.task.ecs_background_task import ecs_background_task


@load_search_data_blueprint.cli.command(
    "load-opportunity-data", help="Load opportunity data from our database to the search index"
)
@click.option(
    "--full-refresh/--incremental",
    default=True,
    help="Whether to run a full refresh, or only incrementally update opportunities",
)
@flask_db.with_db_session()
@flask_opensearch.with_search_client()
@ecs_background_task(task_name="load-opportunity-data-opensearch")
def load_opportunity_data(
    search_client: search.SearchClient, db_session: db.Session, full_refresh: bool
) -> None:
    LoadOpportunitiesToIndex(db_session, search_client, full_refresh).run()


@load_search_data_blueprint.cli.command(
    "load-agency-data", help="Load agency data from our database to the search index"
)
@flask_db.with_db_session()
@flask_opensearch.with_search_client()
@ecs_background_task(task_name="load-agency-data-opensearch")
def load_agency_data(
    search_client: search.SearchClient,
    db_session: db.Session,
) -> None:
    LoadAgenciesToIndex(db_session, search_client).run()
