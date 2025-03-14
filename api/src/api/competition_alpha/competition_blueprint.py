from apiflask import APIBlueprint

competition_blueprint = APIBlueprint(
    "competition_alpha",
    __name__,
    tag="Competition Alpha",
    url_prefix="/alpha",
)
