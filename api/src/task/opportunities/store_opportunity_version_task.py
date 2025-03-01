import logging
from datetime import timedelta

from sqlalchemy import or_, select

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.constants.lookup_constants import JobStatus
from src.db.models.opportunity_models import Opportunity, OpportunityChangeAudit, OpportunityVersion
from src.db.models.task_models import JobLog
from src.services.opportunities_v1.opportunity_version import save_opportunity_version
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.datetime_util import get_now_us_eastern_datetime
from src.util.dict_util import diff_nested_dicts

logger = logging.getLogger(__name__)


@task_blueprint.cli.command(
    "store-opportunity-version",
    help="Store a new opportunity version if an opportunity has been updated",
)
@flask_db.with_db_session()
def store_opportunity_version(db_session: db.Session) -> None:
    StoreOpportunityVersionTask(db_session).run()


SCHEMA = OpportunityV1Schema()


class StoreOpportunityVersionTask(Task):
    def __init__(self, db_session: db.Session) -> None:
        super().__init__(db_session)

    def run_task(self) -> None:

        # Get latest job that run
        latest_job = self.db_session.scalars(
            select(JobLog)
            .where(JobLog.job_type == self.cls_name())
            .where(
                or_(JobLog.job_status == JobStatus.COMPLETED, JobLog.job_status == JobStatus.FAILED)
            )
            .order_by(JobLog.created_at.desc())  # get the latest # add job_status
        ).first()
        # Get opportunity ids that were updated after the latest job run
        latest_time = (
            latest_job.created_at
            if latest_job
            else get_now_us_eastern_datetime() - timedelta(hours=24)
        )  # tbc

        updated_opportunities = self.db_session.scalars(
            select(OpportunityChangeAudit).where(OpportunityChangeAudit.updated_at > latest_time)
        ).all()

        for opp in updated_opportunities:
            # Get Opportunity object
            opportunity = self.db_session.execute(
                select(Opportunity).where(Opportunity.opportunity_id == opp.opportunity_id)
            ).scalar_one()
            # Get Json
            opportunity_v1 = SCHEMA.dump(opportunity)

            # Fetch latest version stored
            latest_versioned_opp = self.db_session.execute(
                select(OpportunityVersion).where(
                    OpportunityVersion.opportunity_id == opp.opportunity_id
                )
            ).scalar_one_or_none()

            # Store to OpportunityVersion table
            if latest_versioned_opp:
                diffs = diff_nested_dicts(opportunity_v1, latest_versioned_opp.opportunity_data)
                if diffs:
                    save_opportunity_version(self.db_session, opportunity)
            else:  # assume updated if no versioned record
                save_opportunity_version(self.db_session, opportunity)
