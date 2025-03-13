from apiflask import APIBlueprint

application_blueprint = APIBlueprint(
    "applications",
    __name__,
    tag="Applications",
    cli_group="applications",
    url_prefix="/v1",
)
