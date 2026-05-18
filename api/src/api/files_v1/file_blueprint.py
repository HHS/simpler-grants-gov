from apiflask import APIBlueprint

file_blueprint = APIBlueprint(
    "file_v1",
    __name__,
    tag="File v1",
    url_prefix="/v1/files",
)
