from apiflask import APIBlueprint

competition_blueprint = APIBlueprint(
    "competition_v1",
    __name__,
    tag="Competition v1",
    url_prefix="/v1/competitions",
)
