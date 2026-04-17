import uuid

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    Privilege,
)
from src.db.models.award_recommendation_models import (
    AwardRecommendation,
    AwardRecommendationAudit,
)
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)


def update_award_recommendation(
    db_session: db.Session, user: User, award_recommendation_id: uuid.UUID, update_data: dict
) -> AwardRecommendation:
    """
    Update an award recommendation with the provided data.
    
    Args:
        db_session: The database session
        user: The authenticated user
        award_recommendation_id: The ID of the award recommendation to update
        update_data: Dictionary containing the fields to update
        
    Returns:
        The updated award recommendation
    """
    # Get and verify access to the award recommendation
    award_recommendation = get_award_recommendation_and_verify_access(
        db_session, user, award_recommendation_id
    )
    
    # Verify update permission
    agency = award_recommendation.opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_AWARD_RECOMMENDATION}, agency)
    
    # Update the fields
    award_recommendation.award_selection_method = update_data["award_selection_method"]
    award_recommendation.additional_info = update_data.get("additional_info")
    award_recommendation.selection_method_detail = update_data.get("funding_strategy")
    award_recommendation.other_key_information = update_data.get("other_key_information")
    
    # Create audit entry for the update
    award_recommendation.award_recommendation_audit_events.append(
        AwardRecommendationAudit(
            user=user,
            award_recommendation_audit_event=AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_UPDATED,
        )
    )
    
    db_session.add(award_recommendation)
    db_session.flush()
    
    # Return the updated award recommendation
    return award_recommendation
