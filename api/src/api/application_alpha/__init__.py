from src.api.application_alpha.application_blueprint import application_blueprint

# import opportunity_routes module to register the API routes on the blueprint
import src.api.application_alpha.application_route  # ruff: ignore[unused-import] isort:skip

__all__ = ["application_blueprint"]
