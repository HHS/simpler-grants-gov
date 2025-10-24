from src.api.extracts_v1.extract_blueprint import extract_blueprint

# import extract_routes module to register the API routes on the blueprint
import src.api.extracts_v1.extract_routes  # noqa: F401 isort:skip

__all__ = ["extract_blueprint"]
