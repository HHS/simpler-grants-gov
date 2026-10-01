from src.api.form_alpha.form_blueprint import form_blueprint

# import opportunity_routes module to register the API routes on the blueprint
import src.api.form_alpha.form_route  # ruff: ignore[unused-import] isort:skip

__all__ = ["form_blueprint"]
