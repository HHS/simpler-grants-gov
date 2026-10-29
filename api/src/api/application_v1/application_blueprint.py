from apiflask import APIBlueprint

application_v1_blueprint = APIBlueprint(
    "application_v1",
    __name__,
    tag="Application V1",
    url_prefix="/v1",
)
