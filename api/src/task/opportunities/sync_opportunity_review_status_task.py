from enum import StrEnum

from sqlalchemy import select, text

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.db.models.foreign.opportunity import VOpportunitySummary
from src.db.models.opportunity_models import ExcludedOpportunityReview
from src.task import task_blueprint
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task


@task_blueprint.cli.command(
    "sync-opportunity-review-status",
    help="Pull opportunities in review status from foreign table v-opportunity_summary into our database",
)
@flask_db.with_db_session()
@ecs_background_task(task_name="sync-opportunity-review-status")
def sync_opportunity_review_status(db_session: db.Session) -> None:
    SyncOpportunityReviewStatus(db_session).run()


REVIEW_STATUS = ["REVIEWABLE", "RETURNED"]


class SyncOpportunityReviewStatus(Task):
    class Metrics(StrEnum):
        OPPORTUNITIES_IN_REVIEW = "opportunities_in_review"

    def __init__(self, db_session: db.Session, schema: str | None = None) -> None:
        super().__init__(db_session)
        self.schema = schema or ExcludedOpportunityReview.__table__.schema

    def run_task(self) -> None:
        with self.db_session.begin():
            self.process_opportunities()

    def process_opportunities(self) -> None:
        # Truncate table
        self.db_session.execute(text(f"TRUNCATE TABLE {self.schema}.excluded_opportunity_review"))
        # Query foreign data
        result = (
            self.db_session.execute(
                select(VOpportunitySummary).where(
                    VOpportunitySummary.omb_review_status_display.in_(REVIEW_STATUS)
                )
            )
            .scalars()
            .all()
        )

        # Insert filtered fields into excluded_opportunity_review
        for row in result:
            record = ExcludedOpportunityReview(
                legacy_opportunity_id=row.opportunity_id,
                omb_review_status_display=row.omb_review_status_display,
                omb_review_status_date=row.omb_review_status_date,
                last_update_date=row.fo_last_upd_dt,
            )

            self.db_session.add(record)
            self.increment(self.Metrics.OPPORTUNITIES_IN_REVIEW)
