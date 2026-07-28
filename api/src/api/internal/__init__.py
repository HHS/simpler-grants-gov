from src.api.internal.internal_blueprint import internal_blueprint

# import internal_routes module to register the API routes on the blueprint
import src.api.internal.internal_routes  # ruff: ignore[unused-import] isort:skip

__all__ = ["internal_blueprint"]
