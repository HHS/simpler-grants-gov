from src.api.opportunities_v1.opportunity_blueprint import opportunity_blueprint

# import opportunity_routes module to register the API routes on the blueprint
import src.api.opportunities_v1.opportunity_routes  # noqa: F401 isort:skip

__all__ = ["opportunity_blueprint"]
