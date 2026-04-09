import logging
from datetime import date
from enum import StrEnum
from typing import Any, cast

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
from src.services.current_opportunity.determine_current_opportunity_summary import (
    determine_current_and_status,
    is_opportunity_changed,
)
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.datetime_util import get_now_us_eastern_date

logger = logging.getLogger(__name__)


@task_blueprint.cli.command(
    "set-current-opportunities",
    help="For each opportunity in the database set/update the current opportunity record",
)
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
            "is_draft": opportunity.is_draft,
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
        current_summary, status = determine_current_and_status(opportunity, self.current_date)

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


def get_log_extra_for_summary(summary: OpportunitySummary | None, prefix: str) -> dict[str, Any]:
    return {
        f"{prefix}_opportunity_summary_id": summary.opportunity_summary_id if summary else None,
        f"{prefix}_opportunity_summary_is_forecast": summary.is_forecast if summary else None,
        f"{prefix}_opportunity_summary_post_date": summary.post_date if summary else None,
        f"{prefix}_opportunity_summary_close_date": summary.close_date if summary else None,
        f"{prefix}_opportunity_summary_archive_date": summary.archive_date if summary else None,
        f"{prefix}_opportunity_summary_created_at": summary.created_at if summary else None,
        f"{prefix}_opportunity_summary_updated_at": summary.updated_at if summary else None,
    }
