from apiflask import APIBlueprint

agency_blueprint = APIBlueprint(
    "agency_v1",
    __name__,
    tag="Agency v1",
    cli_group="agency_v1",
    url_prefix="/v1",
)
