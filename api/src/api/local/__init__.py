from src.api.local.local_blueprint import local_blueprint

# import routes module to register the API routes on the blueprint
import src.api.local.local_route  # noqa: F401 isort:skip

__all__ = ["local_blueprint"]
