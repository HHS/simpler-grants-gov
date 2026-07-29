import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.api.route_utils import raise_flask_error

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import (
    AwardRecommendationStatus,
    Privilege,
    WorkflowEntityType,
    WorkflowEventType,
    WorkflowType,
)
from src.db.models.award_recommendation_models import AwardRecommendation
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)
from src.services.workflows.send_workflow_event import send_workflow_event_to_queue
from src.workflow.event.workflow_event import StartWorkflowEventContext, WorkflowEvent

logger = logging.getLogger(__name__)


def start_award_recommendation_review(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
) -> AwardRecommendation:
    """Start the award recommendation review process by queuing its workflow."""
    award_recommendation = get_award_recommendation_and_verify_access(
        db_session,
        user,
        award_recommendation_id,
    )

    agency = award_recommendation.opportunity.agency_record
    if agency is None:
        raise_flask_error(403, message="Forbidden")

    verify_access(
        user,
        {Privilege.SUBMIT_AWARD_RECOMMENDATION},
        agency,
    )

    # Only draft award recommendations can begin the review process
    if award_recommendation.award_recommendation_status != AwardRecommendationStatus.DRAFT:
        raise_flask_error(
            422,
            message="Award recommendation is not in Draft status",
        )

    # Prevent starting another review workflow
    if award_recommendation.review_workflow_id is not None:
        raise_flask_error(
            422,
            message="Award recommendation review process has already been started",
        )

    # Queue the award recommendation review workflow
    event_id = uuid.uuid4()
    send_workflow_event_to_queue(
        WorkflowEvent(
            event_id=event_id,
            acting_user_id=user.user_id,
            event_type=WorkflowEventType.START_WORKFLOW,
            start_workflow_context=StartWorkflowEventContext(
                workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
                entity_type=WorkflowEntityType.AWARD_RECOMMENDATION,
                entity_id=award_recommendation.award_recommendation_id,
            ),
        )
    )

    logger.info(
        "Started award recommendation review process",
        extra={
            "award_recommendation_id": award_recommendation_id,
            "workflow_event_id": event_id,
        },
    )

    return award_recommendation
