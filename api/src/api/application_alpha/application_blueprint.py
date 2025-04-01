from apiflask import APIBlueprint

application_blueprint = APIBlueprint(
    "application_alpha",
    __name__,
    tag="Application Alpha",
    url_prefix="/alpha",
)
