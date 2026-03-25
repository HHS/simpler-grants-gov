import datetime
from typing import cast

from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import Opportunity, OpportunitySummary


def determine_current_and_status(
    opportunity: Opportunity, current_date: datetime.date
) -> tuple[OpportunitySummary | None, OpportunityStatus | None]:
    """Determine latest forecasted and non-forecasted opportunity summaries"""
    latest_forecasted_summary: OpportunitySummary | None = None
    latest_non_forecasted_summary: OpportunitySummary | None = None

    # If the opportunity is a draft, we don't want to create a status
    if opportunity.is_draft:
        return None, None

    # Latest is based entirely off of the revision number, the latest
    # will always have a null revision number, and because of how the
    # data is structured that we import, we'll only ever have a single
    # null value for forecast and non-forecast respectively
    for summary in opportunity.all_opportunity_summaries:
        if summary.is_forecast:
            latest_forecasted_summary = summary
        else:
            latest_non_forecasted_summary = summary

    # We need to make sure the latest can actually be publicly displayed
    # Note that if it cannot, we do not want to use an earlier revision
    # even if that revision doesn't have the same issue. Only the latest
    # revisions of forecast/non-forecast records are ever an option
    if (
        latest_forecasted_summary is not None
        and not latest_forecasted_summary.can_summary_be_public(current_date)
    ):
        latest_forecasted_summary = None

    if (
        latest_non_forecasted_summary is not None
        and not latest_non_forecasted_summary.can_summary_be_public(current_date)
    ):
        latest_non_forecasted_summary = None

    if latest_forecasted_summary is None and latest_non_forecasted_summary is None:
        return None, None

    # A non-forecast always takes precedence over a forecast
    if latest_non_forecasted_summary is not None:
        return latest_non_forecasted_summary, determine_opportunity_status(
            latest_non_forecasted_summary, current_date
        )

    # Otherwise we'll use the forecast
    return latest_forecasted_summary, determine_opportunity_status(
        cast(OpportunitySummary, latest_forecasted_summary), current_date
    )


def determine_opportunity_status(
    opportunity_summary: OpportunitySummary, current_date: datetime.date
) -> OpportunityStatus:
    # Any past archive date, it should be archived
    if (
        opportunity_summary.archive_date is not None
        and opportunity_summary.archive_date < current_date
    ):
        return OpportunityStatus.ARCHIVED

    # Any past close date, should be closed
    if opportunity_summary.close_date is not None and opportunity_summary.close_date < current_date:
        return OpportunityStatus.CLOSED

    # Otherwise the status is based on whether it is a forecast
    # note that we know it is after the post date as that was checked
    # before calling this method
    if opportunity_summary.is_forecast:
        return OpportunityStatus.FORECASTED

    return OpportunityStatus.POSTED


def is_opportunity_changed(
    opportunity: Opportunity,
    current_summary: OpportunitySummary | None,
    status: OpportunityStatus | None,
) -> bool:
    # This is a utility method to help us know whether an opportunity will be changed
    # during this iteration of the process.

    if opportunity.current_opportunity_summary is None:
        # There is no current, and we still don't think there should be one
        if current_summary is None:
            return False

        # There is no current, but we want to add one
        return True

    # We plan to remove the current summary
    if current_summary is None:
        return True

    # The specific current opportunity summary is changing
    if (
        opportunity.current_opportunity_summary.opportunity_summary_id
        != current_summary.opportunity_summary_id
    ):
        return True

    return opportunity.current_opportunity_summary.opportunity_status != status
