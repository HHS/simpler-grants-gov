from src.api.opportunities.opportunity_blueprint import opportunity_blueprint_v0, opportunity_blueprint_v0_1

# import opportunity_routes module to register the API routes on the blueprint
import src.api.opportunities.opportunity_routes  # noqa: F401 E402 isort:skip

__all__ = ["opportunity_blueprint_v0", "opportunity_blueprint_v0_1"]
