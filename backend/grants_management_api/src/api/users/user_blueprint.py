from apiflask import APIBlueprint

user_blueprint = APIBlueprint(
    "user_v1",
    __name__,
    tag="User v1 - Internal Only",
    cli_group="user_v1",
    url_prefix="/v1/users",
)
