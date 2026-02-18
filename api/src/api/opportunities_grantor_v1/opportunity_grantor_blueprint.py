from apiflask import APIBlueprint

opportunity_grantor_blueprint = APIBlueprint(
    "opportunity_grantor_v1",
    __name__,
    tag="Opportunity v1 - for Grantors",
    cli_group="opportunity_grantor_v1",
    url_prefix="/v1/grantors",
)
