from src.api.agencies_v1.agency_blueprint import agency_blueprint

# import agency_routes module to register the API routes on the blueprint
import src.api.agencies_v1.agency_routes  # ruff: ignore[unused-import] isort:skip

__all__ = ["agency_blueprint"]
