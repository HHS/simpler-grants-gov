import logging
import uuid

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api import response
from src.api.award_recommendations_alpha.award_recommendation_blueprint import (
    award_recommendation_blueprint,
)
from src.api.award_recommendations_alpha.award_recommendation_schemas import (
    AwardRecommendationGetResponseSchema,
)
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)

logger = logging.getLogger(__name__)


@award_recommendation_blueprint.get("/award-recommendations/<uuid:award_recommendation_id>")
@award_recommendation_blueprint.output(AwardRecommendationGetResponseSchema)
@award_recommendation_blueprint.doc(
    summary="Get Award Recommendation",
    description="Retrieve an award recommendation by ID, including opportunity details, attachments, and reviews.",
    responses=[200, 401, 403, 404],
)
@jwt_or_api_user_key_multi_auth.login_required
@flask_db.with_db_session()
def award_recommendation_get(
    db_session: db.Session, award_recommendation_id: uuid.UUID
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"award_recommendation_id": award_recommendation_id})
    logger.info("GET /alpha/award-recommendations/:award_recommendation_id")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        award_recommendation = get_award_recommendation_and_verify_access(
            db_session, user, award_recommendation_id
        )

    return response.ApiResponse(message="Success", data=award_recommendation)
