import src.adapters.db as db
import src.adapters.search as search
from src.adapters.db import flask_db
from src.search.backend.load_opportunities_to_index import LoadOpportunitiesToIndex
from src.search.backend.load_search_data_blueprint import load_search_data_blueprint


@load_search_data_blueprint.cli.command(
    "load-opportunity-data", help="Load opportunity data from our database to the search index"
)
@flask_db.with_db_session()
def load_opportunity_data(db_session: db.Session) -> None:
    search_client = search.SearchClient()

    LoadOpportunitiesToIndex(db_session, search_client).run()
