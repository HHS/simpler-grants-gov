from apiflask import APIBlueprint

user_blueprint = APIBlueprint("user", __name__, tag="User", cli_group="user")
