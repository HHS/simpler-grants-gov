from src.api.award_recommendations_alpha.award_recommendation_blueprint import (
    award_recommendation_blueprint,
)

import src.api.award_recommendations_alpha.award_recommendation_routes  # noqa: F401 isort:skip

__all__ = ["award_recommendation_blueprint"]
