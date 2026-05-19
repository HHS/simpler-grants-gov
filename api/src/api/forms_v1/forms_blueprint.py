from apiflask import APIBlueprint

forms_blueprint = APIBlueprint(
    "forms_v1",
    __name__,
    tag="Forms v1",
    cli_group="forms_v1",
    url_prefix="/v1",
)
