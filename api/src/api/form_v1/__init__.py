from src.api.form_v1.form_blueprint import form_v1_blueprint

# import form_routes module to register the API routes on the blueprint
import src.api.form_v1.form_routes  # noqa: F401 isort:skip

__all__ = ["form_v1_blueprint"]
