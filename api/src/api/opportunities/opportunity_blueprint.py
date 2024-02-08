from apiflask import APIBlueprint

opportunity_blueprint_v0 = APIBlueprint(
    "opportunity_v0", __name__, tag="Opportunity v0", cli_group="opportunity_v0"
)

opportunity_blueprint_v0_1 = APIBlueprint(
    "opportunity_v0_1", __name__, tag="Opportunity v0.1", cli_group="opportunity_v0_1"
)