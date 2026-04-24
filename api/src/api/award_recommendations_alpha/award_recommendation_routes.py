import logging
import uuid

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api import response
from src.api.award_recommendations_alpha.award_recommendation_blueprint import (
    award_recommendation_blueprint,
)
from src.api.award_recommendations_alpha.award_recommendation_schemas import (
    AwardRecommendationAuditRequestSchema,
    AwardRecommendationAuditResponseSchema,
    AwardRecommendationCreateRequestSchema,
    AwardRecommendationGetResponseSchema,
    AwardRecommendationReviewUpdateRequestSchema,
    AwardRecommendationReviewUpdateResponseSchema,
    AwardRecommendationRiskRequestSchema,
    AwardRecommendationRiskResponseSchema,
    AwardRecommendationSubmissionListRequestSchema,
    AwardRecommendationSubmissionListResponseSchema,
    AwardRecommendationUpdateRequestSchema,
)
from src.api.schemas.response_schema import AbstractResponseSchema
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.award_recommendations.create_award_recommendation import (
    create_award_recommendation,
)
from src.services.award_recommendations.create_award_recommendation_risk import (
    create_award_recommendation_risk,
)
from src.services.award_recommendations.delete_award_recommendation_risk import (
    delete_award_recommendation_risk,
)
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)
from src.services.award_recommendations.list_award_recommendation_audit import (
    list_award_recommendation_audit,
)
from src.services.award_recommendations.list_award_recommendation_submissions import (
    list_award_recommendation_submissions,
)
from src.services.award_recommendations.update_award_recommendation import (
    update_award_recommendation,
)
from src.services.award_recommendations.update_award_recommendation_review import (
    update_award_recommendation_review,
)
from src.services.award_recommendations.update_award_recommendation_risk import (
    update_award_recommendation_risk,
)

logger = logging.getLogger(__name__)


@award_recommendation_blueprint.post("/award-recommendations")
@award_recommendation_blueprint.input(AwardRecommendationCreateRequestSchema, location="json")
@award_recommendation_blueprint.output(AwardRecommendationGetResponseSchema)
@award_recommendation_blueprint.doc(
    summary="Create Award Recommendation",
    description="Create a new award recommendation for an opportunity, linking application submissions and audit data.",
    responses=[200, 401, 403, 404, 422],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def award_recommendation_create(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"opportunity_id": json_data.get("opportunity_id")})
    logger.info("POST /alpha/award-recommendations")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        award_recommendation = create_award_recommendation(db_session, user, json_data)

    return response.ApiResponse(message="Success", data=award_recommendation)


@award_recommendation_blueprint.get("/award-recommendations/<uuid:award_recommendation_id>")
@award_recommendation_blueprint.output(AwardRecommendationGetResponseSchema)
@award_recommendation_blueprint.doc(
    summary="Get Award Recommendation",
    description="Retrieve an award recommendation by ID, including opportunity details, attachments, and reviews.",
    responses=[200, 401, 403, 404],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
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


@award_recommendation_blueprint.post(
    "/award-recommendations/<uuid:award_recommendation_id>/submissions/list"
)
@award_recommendation_blueprint.input(
    AwardRecommendationSubmissionListRequestSchema(), location="json"
)
@award_recommendation_blueprint.output(AwardRecommendationSubmissionListResponseSchema())
@award_recommendation_blueprint.doc(
    summary="List Award Recommendation Submissions",
    description="Get paginated list of application submissions for an award recommendation.",
    responses=[200, 401, 403, 404],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def award_recommendation_submission_list(
    db_session: db.Session, award_recommendation_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"award_recommendation_id": award_recommendation_id})
    logger.info("POST /alpha/award-recommendations/:award_recommendation_id/submissions/list")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        submissions, pagination_info = list_award_recommendation_submissions(
            db_session, user, award_recommendation_id, json_data
        )

    add_extra_data_to_current_request_logs(
        {
            "response.pagination.total_pages": pagination_info.total_pages,
            "response.pagination.total_records": pagination_info.total_records,
        }
    )
    logger.info("Successfully fetched award recommendation submissions")

    return response.ApiResponse(
        message="Success", data=submissions, pagination_info=pagination_info
    )


@award_recommendation_blueprint.put("/award-recommendations/<uuid:award_recommendation_id>")
@award_recommendation_blueprint.input(AwardRecommendationUpdateRequestSchema, location="json")
@award_recommendation_blueprint.output(AwardRecommendationGetResponseSchema)
@award_recommendation_blueprint.doc(
    summary="Update Award Recommendation",
    description="Update an existing award recommendation with new values for fields.",
    responses=[200, 401, 403, 404, 422],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def award_recommendation_update(
    db_session: db.Session, award_recommendation_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"award_recommendation_id": award_recommendation_id})
    logger.info("PUT /alpha/award-recommendations/:award_recommendation_id")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        updated_award_recommendation = update_award_recommendation(
            db_session, user, award_recommendation_id, json_data
        )

    return response.ApiResponse(message="Success", data=updated_award_recommendation)


@award_recommendation_blueprint.put(
    "/award-recommendations/<uuid:award_recommendation_id>/reviews/<uuid:award_recommendation_review_id>"
)
@award_recommendation_blueprint.input(AwardRecommendationReviewUpdateRequestSchema, location="json")
@award_recommendation_blueprint.output(AwardRecommendationReviewUpdateResponseSchema)
@award_recommendation_blueprint.doc(
    summary="Update Award Recommendation Review",
    description="Update a review on an award recommendation.",
    responses=[200, 401, 403, 404, 422],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def award_recommendation_review_update(
    db_session: db.Session,
    award_recommendation_id: uuid.UUID,
    award_recommendation_review_id: uuid.UUID,
    json_data: dict,
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs(
        {
            "award_recommendation_id": award_recommendation_id,
            "award_recommendation_review_id": award_recommendation_review_id,
        }
    )
    logger.info(
        "PUT /alpha/award-recommendations/:award_recommendation_id/reviews/:award_recommendation_review_id"
    )

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        review = update_award_recommendation_review(
            db_session,
            user,
            award_recommendation_id,
            award_recommendation_review_id,
            json_data,
        )

    return response.ApiResponse(message="Success", data=review)


@award_recommendation_blueprint.post("/award-recommendations/<uuid:award_recommendation_id>/risks")
@award_recommendation_blueprint.input(AwardRecommendationRiskRequestSchema, location="json")
@award_recommendation_blueprint.output(AwardRecommendationRiskResponseSchema)
@award_recommendation_blueprint.doc(
    summary="Create Award Recommendation Risk",
    description="Create a risk for an award recommendation, linking it to application submissions.",
    responses=[200, 401, 403, 404, 422],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def award_recommendation_risk_create(
    db_session: db.Session, award_recommendation_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"award_recommendation_id": award_recommendation_id})
    logger.info("POST /alpha/award-recommendations/:award_recommendation_id/risks")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        risk = create_award_recommendation_risk(
            db_session, user, award_recommendation_id, json_data
        )

    return response.ApiResponse(message="Success", data=risk)


@award_recommendation_blueprint.put(
    "/award-recommendations/<uuid:award_recommendation_id>/risks/<uuid:award_recommendation_risk_id>"
)
@award_recommendation_blueprint.input(AwardRecommendationRiskRequestSchema, location="json")
@award_recommendation_blueprint.output(AwardRecommendationRiskResponseSchema)
@award_recommendation_blueprint.doc(
    summary="Update Award Recommendation Risk",
    description="Update a risk on an award recommendation, including linked application submissions.",
    responses=[200, 401, 403, 404, 422],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def award_recommendation_risk_update(
    db_session: db.Session,
    award_recommendation_id: uuid.UUID,
    award_recommendation_risk_id: uuid.UUID,
    json_data: dict,
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs(
        {
            "award_recommendation_id": award_recommendation_id,
            "award_recommendation_risk_id": award_recommendation_risk_id,
        }
    )
    logger.info(
        "PUT /alpha/award-recommendations/:award_recommendation_id/risks/:award_recommendation_risk_id"
    )

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        risk = update_award_recommendation_risk(
            db_session, user, award_recommendation_id, award_recommendation_risk_id, json_data
        )

    return response.ApiResponse(message="Success", data=risk)


@award_recommendation_blueprint.post(
    "/award-recommendations/<uuid:award_recommendation_id>/audit_history"
)
@award_recommendation_blueprint.input(AwardRecommendationAuditRequestSchema(), location="json")
@award_recommendation_blueprint.output(AwardRecommendationAuditResponseSchema())
@award_recommendation_blueprint.doc(
    summary="List Award Recommendation Audit History",
    description="Get paginated audit history for an award recommendation.",
    responses=[200, 401, 403, 404, 422],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def award_recommendation_audit_list(
    db_session: db.Session, award_recommendation_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"award_recommendation_id": award_recommendation_id})
    logger.info("POST /alpha/award-recommendations/:award_recommendation_id/audit_history")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        audit_events, pagination_info = list_award_recommendation_audit(
            db_session, user, award_recommendation_id, json_data
        )

    add_extra_data_to_current_request_logs(
        {
            "response.pagination.total_pages": pagination_info.total_pages,
            "response.pagination.total_records": pagination_info.total_records,
        }
    )
    logger.info("Successfully fetched award recommendation audit history")

    return response.ApiResponse(
        message="Success", data=audit_events, pagination_info=pagination_info
    )


@award_recommendation_blueprint.delete(
    "/award-recommendations/<uuid:award_recommendation_id>/risks/<uuid:award_recommendation_risk_id>"
)
@award_recommendation_blueprint.output(AbstractResponseSchema)
@award_recommendation_blueprint.doc(
    summary="Delete Award Recommendation Risk",
    description="Soft delete a risk for an award recommendation.",
    responses=[200, 401, 403, 404],
)
@award_recommendation_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def award_recommendation_risk_delete(
    db_session: db.Session,
    award_recommendation_id: uuid.UUID,
    award_recommendation_risk_id: uuid.UUID,
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs(
        {
            "award_recommendation_id": award_recommendation_id,
            "award_recommendation_risk_id": award_recommendation_risk_id,
        }
    )
    logger.info(
        "DELETE /alpha/award-recommendations/:award_recommendation_id/risks/:award_recommendation_risk_id"
    )

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        delete_award_recommendation_risk(
            db_session, user, award_recommendation_id, award_recommendation_risk_id
        )

    return response.ApiResponse(message="Success", data=None)
