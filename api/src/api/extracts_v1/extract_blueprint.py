from apiflask import APIBlueprint

extract_blueprint = APIBlueprint(
    "extract_v1",
    __name__,
    tag="Extract v1",
    cli_group="extract_v1",
    url_prefix="/v1",
)
