from src.api.users.user_blueprint import user_blueprint

# import user_routes module to register the API routes on the blueprint
import src.api.users.user_routes  # noqa: F401 isort:skip

__all__ = ["user_blueprint"]
