from apiflask import APIBlueprint

form_blueprint = APIBlueprint(
    "form_alpha",
    __name__,
    tag="Form Alpha",
    url_prefix="/alpha",
)
