from src.api.users.user_blueprint import user_blueprint

# import user_commands module to register the CLI commands on the user_blueprint
import src.api.users.user_commands  # noqa: F401 E402 isort:skip

# import user_commands module to register the API routes on the user_blueprint
import src.api.users.user_routes  # noqa: F401 E402 isort:skip


__all__ = ["user_blueprint"]
