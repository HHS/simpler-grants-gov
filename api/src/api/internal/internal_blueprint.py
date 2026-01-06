from apiflask import APIBlueprint

internal_blueprint = APIBlueprint(
    "internal_v1",
    __name__,
    tag="Internal v1 - Admin Only",
    url_prefix="/v1/internal",
)
