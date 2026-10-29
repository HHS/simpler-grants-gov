import logging

from src.constants.lookup_constants import OpportunityAuditEvent
from src.db.models.opportunity_models import Opportunity, OpportunityAudit
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def build_opportunity_audit_event(
    opportunity: Opportunity,
    user: User,
    audit_event: OpportunityAuditEvent,
    opportunity_data: dict | None = None,
    nonforecast_opportunity_summary: dict | None = None,
    competition: dict | None = None,
) -> OpportunityAudit:
    """Build an opportunity audit event and log it"""
    audit = OpportunityAudit(
        user=user,
        opportunity_audit_event=audit_event,
        opportunity_data=opportunity_data,
        nonforecast_opportunity_summary=nonforecast_opportunity_summary,
        competition=competition,
    )

    _log_audit_event(audit, opportunity)
    return audit


def _log_audit_event(audit: OpportunityAudit, opportunity: Opportunity) -> None:
    logger.info(
        "Added opportunity audit event",
        extra={
            "opportunity_id": opportunity.opportunity_id,
            "user_id": audit.user_id,
            "opportunity_audit_event": audit.opportunity_audit_event,
        },
    )
