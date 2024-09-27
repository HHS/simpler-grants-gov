from apiflask import APIBlueprint

load_search_data_blueprint = APIBlueprint(
    "load-search-data", __name__, enable_openapi=False, cli_group="load-search-data"
)
