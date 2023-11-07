from apiflask import APIBlueprint

opportunity_blueprint = APIBlueprint(
    "opportunity", __name__, tag="Opportunity", cli_group="opportunity"
)
