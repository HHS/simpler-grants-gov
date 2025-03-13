from src.api.applications.application_blueprint import application_blueprint

# import application_routes module to register the API routes on the blueprint
import src.api.applications.application_routes  # noqa: F401 E402 isort:skip

__all__ = ["application_blueprint"]
