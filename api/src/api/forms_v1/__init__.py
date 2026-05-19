from src.api.forms_v1.forms_blueprint import forms_blueprint

# Import forms_routes module to register the API routes on the blueprint
import src.api.forms_v1.forms_routes  # noqa: F401 isort:skip

__all__ = ["forms_blueprint"]
