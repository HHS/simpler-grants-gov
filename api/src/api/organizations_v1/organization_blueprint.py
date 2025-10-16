from apiflask import APIBlueprint

organization_blueprint = APIBlueprint(
    "organization_v1",
    __name__,
    tag="Organization v1",
    cli_group="organization_v1",
    url_prefix="/v1/organizations",
)
