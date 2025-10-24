from src.api.competition_alpha.competition_blueprint import competition_blueprint

# import opportunity_routes module to register the API routes on the blueprint
import src.api.competition_alpha.competition_route  # noqa: F401 isort:skip

__all__ = ["competition_blueprint"]
