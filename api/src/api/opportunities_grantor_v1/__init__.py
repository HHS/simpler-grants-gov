from src.api.opportunities_grantor_v1.opportunity_grantor_blueprint import (
    opportunity_grantor_blueprint,
)

# import opportunity_grantor_routes module to register the API routes on the blueprint
import src.api.opportunities_grantor_v1.opportunity_grantor_routes  # noqa: F401 isort:skip

__all__ = ["opportunity_grantor_blueprint"]
