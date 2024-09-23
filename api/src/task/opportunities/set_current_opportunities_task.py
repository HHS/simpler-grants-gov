import logging
from datetime import date
from enum import StrEnum
from typing import Any, Tuple, cast

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.datetime_util import get_now_us_eastern_date

logger = logging.getLogger(__name__)

TASK_NAME = "set-current-opportunities"


@task_blueprint.cli.command(
    TASK_NAME,
    help="For each opportunity in the database set/update the current opportunity record",
)
@ecs_background_task(TASK_NAME)
@flask_db.with_db_session()
def set_current_opportunities(db_session: db.Session) -> None:
    SetCurrentOpportunitiesTask(db_session).run()


class SetCurrentOpportunitiesTask(Task):
    def __init__(self, db_session: db.Session, current_date: date | None = None) -> None:
        super().__init__(db_session)
        if current_date is None:
            current_date = get_now_us_eastern_date()
        self.current_date = current_date

    class Metrics(StrEnum):
        OPPORTUNITY_COUNT = "opportunity_count"

        UNMODIFIED_OPPORTUNITY_COUNT = "unmodified_opportunity_count"
        MODIFIED_OPPORTUNITY_COUNT = "modified_opportunity_count"

        DELETED_CURRENT_OPPORTUNITY_COUNT = "deleted_current_opportunity_count"
        NEW_CURRENT_OPPORTUNITY_COUNT = "new_current_opportunity_count"
        UPDATED_CURRENT_OPPORTUNITY_COUNT = "updated_current_opportunity_count"

        NONE_OPPORTUNITY_STATUS_COUNT = "none_opportunity_status_count"
        POSTED_OPPORTUNITY_STATUS_COUNT = "posted_opportunity_status_count"
        FORECASTED_OPPORTUNITY_STATUS_COUNT = "forecasted_opportunity_status_count"
        CLOSED_OPPORTUNITY_STATUS_COUNT = "closed_opportunity_status_count"
        ARCHIVED_OPPORTUNITY_STATUS_COUNT = "archived_opportunity_status_count"

    def run_task(self) -> None:
        with self.db_session.begin():
            self._process_opportunities()

    def _process_opportunities(self) -> None:
        # This selectinload significantly imrproves performance as it tells SQLAlchemy
        # to fetch all summaries+current opportunity summaries rather than lazy loading
        # them as needed.
        opportunities = self.db_session.scalars(
            select(Opportunity)
            .options(
                selectinload(Opportunity.all_opportunity_summaries),
                selectinload(Opportunity.current_opportunity_summary),
                # yield_per makes it so the query loads records 5000 at a time into memory
                # rather than everything all at once.
                # https://docs.sqlalchemy.org/en/20/orm/queryguide/api.html#fetching-large-result-sets-with-yield-per
            )
            .execution_options(yield_per=5000)
        )

        for opportunity in opportunities:
            self._process_opportunity(opportunity)

    def _process_opportunity(self, opportunity: Opportunity) -> None:
        self.increment(self.Metrics.OPPORTUNITY_COUNT)

        log_extra = {
            "opportunity_id": opportunity.opportunity_id,
            "existing_opportunity_status": opportunity.opportunity_status,
        }
        log_extra |= get_log_extra_for_summary(
            (
                opportunity.current_opportunity_summary.opportunity_summary
                if opportunity.current_opportunity_summary
                else None
            ),
            "existing",
        )
        logger.info("Processing opportunity %s", opportunity.opportunity_id, extra=log_extra)

        # Determine what the current opportunity summary + status should be
        current_summary, status = self.determine_current_and_status(opportunity)

        # Count the number of opportunity statuses we calculated (None included)
        self.increment(f"{str(status).lower()}_opportunity_status_count")

        # Check whether we actually found any change.
        # No need to update records in the DB that aren't changing
        if is_opportunity_changed(opportunity, current_summary, status):
            self.increment(self.Metrics.MODIFIED_OPPORTUNITY_COUNT)
            log_extra |= {"updated_opportunity_status": status}
            log_extra |= get_log_extra_for_summary(current_summary, "updated")

            logger.info(
                "Opportunity %s requires an update", opportunity.opportunity_id, extra=log_extra
            )
        else:
            self.increment(self.Metrics.UNMODIFIED_OPPORTUNITY_COUNT)
            logger.info(
                "Opportunity %s does not require an update for its current summary or status",
                opportunity.opportunity_id,
                extra=log_extra,
            )
            return

        if current_summary is None:
            # We determined the opportunity should not have a current and need to delete it
            if opportunity.current_opportunity_summary is not None:
                self.db_session.delete(opportunity.current_opportunity_summary)
                self.increment(self.Metrics.DELETED_CURRENT_OPPORTUNITY_COUNT)

            # Whether or not we needed to delete a record, or it was already null, we can
            # safely return here as there isn't anything else to update
            return

        # If the current opportunity summary doesn't already exist, create it first
        if opportunity.current_opportunity_summary is None:
            opportunity.current_opportunity_summary = CurrentOpportunitySummary(
                opportunity=opportunity
            )
            self.increment(self.Metrics.NEW_CURRENT_OPPORTUNITY_COUNT)
        else:
            self.increment(self.Metrics.UPDATED_CURRENT_OPPORTUNITY_COUNT)

        # In either case, update the summary + status
        opportunity.current_opportunity_summary.opportunity_summary = current_summary
        opportunity.current_opportunity_summary.opportunity_status = cast(OpportunityStatus, status)

    def determine_current_and_status(
        self, opportunity: Opportunity
    ) -> Tuple[OpportunitySummary | None, OpportunityStatus | None]:
        # Determine latest forecasted and non-forecasted opportunity summaries
        latest_forecasted_summary: OpportunitySummary | None = None
        latest_non_forecasted_summary: OpportunitySummary | None = None

        # Latest is based entirely off of the revision number, the latest
        # will always have a null revision number, and because of how the
        # data is structured that we import, we'll only ever have a single
        # null value for forecast and non-forecast respectively
        for summary in opportunity.all_opportunity_summaries:
            if summary.is_forecast and summary.revision_number is None:
                latest_forecasted_summary = summary
            elif not summary.is_forecast and summary.revision_number is None:
                latest_non_forecasted_summary = summary

        # We need to make sure the latest can actually be publicly displayed
        # Note that if it cannot, we do not want to use an earlier revision
        # even if that revision doesn't have the same issue. Only the latest
        # revisions of forecast/non-forecast records are ever an option
        if (
            latest_forecasted_summary is not None
            and not latest_forecasted_summary.can_summary_be_public(self.current_date)
        ):
            latest_forecasted_summary = None

        if (
            latest_non_forecasted_summary is not None
            and not latest_non_forecasted_summary.can_summary_be_public(self.current_date)
        ):
            latest_non_forecasted_summary = None

        if latest_forecasted_summary is None and latest_non_forecasted_summary is None:
            return None, None

        # A non-forecast always takes precedence over a forecast
        if latest_non_forecasted_summary is not None:
            return latest_non_forecasted_summary, self.determine_opportunity_status(
                latest_non_forecasted_summary
            )

        # Otherwise we'll use the forecast
        return latest_forecasted_summary, self.determine_opportunity_status(
            cast(OpportunitySummary, latest_forecasted_summary)
        )

    def determine_opportunity_status(
        self, opportunity_summary: OpportunitySummary
    ) -> OpportunityStatus:
        # Any past archive date, it should be archived
        if (
            opportunity_summary.archive_date is not None
            and opportunity_summary.archive_date < self.current_date
        ):
            return OpportunityStatus.ARCHIVED

        # Any past close date, should be closed
        if (
            opportunity_summary.close_date is not None
            and opportunity_summary.close_date < self.current_date
        ):
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


def get_log_extra_for_summary(summary: OpportunitySummary | None, prefix: str) -> dict[str, Any]:
    return {
        f"{prefix}_opportunity_summary_id": summary.opportunity_summary_id if summary else None,
        f"{prefix}_opportunity_summary_revision_number": (
            summary.revision_number if summary else None
        ),
        f"{prefix}_opportunity_summary_is_forecast": summary.is_forecast if summary else None,
        f"{prefix}_opportunity_summary_post_date": summary.post_date if summary else None,
        f"{prefix}_opportunity_summary_close_date": summary.close_date if summary else None,
        f"{prefix}_opportunity_summary_archive_date": summary.archive_date if summary else None,
        f"{prefix}_opportunity_summary_is_deleted": summary.is_deleted if summary else None,
        f"{prefix}_opportunity_summary_created_at": summary.created_at if summary else None,
        f"{prefix}_opportunity_summary_updated_at": summary.updated_at if summary else None,
    }
