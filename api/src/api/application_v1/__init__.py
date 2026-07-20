from src.api.application_v1.application_blueprint import application_v1_blueprint

# import application_route module to register the API routes on the blueprint
import src.api.application_v1.application_route  # noqa: F401 isort:skip

__all__ = ["application_v1_blueprint"]
