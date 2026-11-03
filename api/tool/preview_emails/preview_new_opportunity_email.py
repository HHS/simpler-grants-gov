# Send the new opportunity notification email to the local Mailpit inbox.
#
# Data is created in memory and not persisted in db
#
# Run it with:
#   make preview-new-opportunity-email
#
# Then read what was sent at http://localhost:8025


import logging
import uuid
from datetime import date

import src.logs
import tests.src.db.models.factories as factories
from src.adapters.aws.local_email_adapter import send_local_email_if_enabled
from src.db.models.opportunity_models import Opportunity
from src.task.notifications.config import get_email_config
from src.task.notifications.new_opportunity_notification import build_email_body, build_subject
from src.util import datetime_util

logger = logging.getLogger(__name__)

# This is only sent locally so no need to specify anything else here
TO_ADDRESS = "preview@simpler.grants.gov"
MAILPIT_URL = "http://localhost:8025"


def send_new_opportunity_preview_email(
    opportunities: list[Opportunity] | None = None,
) -> str | None:
    if opportunities is None:
        opportunities = build_sample_opportunities()

    message_id = send_local_email_if_enabled(
        to_address=TO_ADDRESS,
        subject=build_subject(datetime_util.utcnow().date()),
        message=build_email_body(opportunities, get_email_config().frontend_base_url),
        trace_id=str(uuid.uuid4()),
    )

    if message_id is None:
        logger.warning(
            "Local email capture is disabled, nothing was sent. "
            "Set ENABLE_LOCAL_EMAIL_CAPTURE=TRUE to preview the email."
        )
        return None

    logger.info(
        f"Sent the new opportunity email to Mailpit at {MAILPIT_URL}",
        extra={
            "to_address": TO_ADDRESS,
            "message_id": message_id,
            "opportunity_count": len(opportunities),
        },
    )
    return message_id


def build_sample_opportunities() -> list[Opportunity]:
    """Build the opportunities with scenarios: everything set, forecasted, nothing set"""
    return [
        _build_opportunity(
            "Research & <Development> Innovation Grants",
            agency=("DOD", "Department of Defense"),
            post_date=date(2026, 1, 2),
            close_date=date(2026, 3, 4),
            award_floor=10_000,
            award_ceiling=1_500_000,
            expected_number_of_awards=25,
            is_cost_sharing=True,
        ),
        _build_opportunity(
            "Community Health Infrastructure (Forecasted)",
            agency=("HHS", "Department of Health and Human Services"),
            summary_trait="is_forecasted_summary",
            forecasted_post_date=date(2026, 5, 1),
            forecasted_close_date=date(2026, 7, 1),
            award_floor=None,
            award_ceiling=750_000,
            expected_number_of_awards=None,
            is_cost_sharing=False,
        ),
        _build_opportunity(
            "Rural Broadband Expansion",
            post_date=None,
            close_date=None,
            award_floor=None,
            award_ceiling=None,
            expected_number_of_awards=None,
            is_cost_sharing=None,
        ),
    ]


def _build_opportunity(
    title: str,
    agency: tuple[str, str] | None = None,
    summary_trait: str = "is_posted_summary",
    **summary_fields: object,
) -> Opportunity:
    opportunity = factories.OpportunityFactory.build(
        opportunity_title=title, no_current_summary=True
    )
    opportunity.current_opportunity_summary = factories.CurrentOpportunitySummaryFactory.build(
        opportunity=opportunity, **{summary_trait: True}
    )
    for field, value in summary_fields.items():
        setattr(opportunity.summary, field, value)

    if agency is not None:
        agency_code, agency_name = agency
        opportunity.agency_record = factories.AgencyFactory.build(
            agency_code=agency_code, agency_name=agency_name
        )

    return opportunity


def main() -> None:
    with src.logs.init("preview_new_opportunity_email"):
        send_new_opportunity_preview_email()


if __name__ == "__main__":
    main()
