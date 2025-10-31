from apiflask import APIBlueprint

local_blueprint = APIBlueprint(
    "local_endpoint",
    __name__,
    tag="LOCAL ONLY",
    url_prefix="/local",
)
