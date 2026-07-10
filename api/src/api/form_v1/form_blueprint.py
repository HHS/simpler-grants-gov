from apiflask import APIBlueprint

form_v1_blueprint = APIBlueprint(
    "form_v1",
    __name__,
    tag="Form V1",
    url_prefix="/v1",
)
