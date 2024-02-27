from apiflask import APIBlueprint

opportunity_blueprint = APIBlueprint(
    "opportunity_v0_1",
    __name__,
    tag="Opportunity v0.1",
    cli_group="opportunity_v0_1",
    url_prefix="/v0.1",
)
