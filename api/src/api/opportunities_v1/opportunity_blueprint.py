from apiflask import APIBlueprint

opportunity_blueprint = APIBlueprint(
    "opportunity_v1",
    __name__,
    tag="Opportunity v1",
    cli_group="opportunity_v1",
    url_prefix="/v1",
)
