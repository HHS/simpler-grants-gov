from src.api.organizations_v1.organization_blueprint import organization_blueprint

# import organization_routes module to register the API routes on the blueprint
import src.api.organizations_v1.organization_routes  # noqa: F401 isort:skip

__all__ = ["organization_blueprint"]
