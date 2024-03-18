from apiflask import APIBlueprint

data_migration_blueprint = APIBlueprint(
    "data-migration", __name__, enable_openapi=False, cli_group="data-migration"
)
