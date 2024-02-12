from apiflask import APIBlueprint

opportunity_blueprint = APIBlueprint(
    "opportunity_v0", __name__, tag="Opportunity v0", cli_group="opportunity_v0", url_prefix="/v0"
)
