from src.api.competitions_v1.competition_blueprint import competition_blueprint

# import competition_routes module to register the API routes on the blueprint
import src.api.competitions_v1.competition_routes  # noqa: F401 isort:skip

__all__ = ["competition_blueprint"]
