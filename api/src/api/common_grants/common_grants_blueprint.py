from apiflask import APIBlueprint

common_grants_blueprint = APIBlueprint(
    "common_grants",
    __name__,
    tag="CommonGrants Protocol",
    cli_group="common_grants",
    url_prefix="/common-grants",
)
