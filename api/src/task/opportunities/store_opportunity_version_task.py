import logging
from datetime import datetime

from sqlalchemy import or_, select

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.constants.lookup_constants import JobStatus
from src.db.models.opportunity_models import Opportunity, OpportunityChangeAudit
from src.db.models.task_models import JobLog
from src.services.opportunities_v1.opportunity_version import save_opportunity_version
from src.task.task import Task
from src.task.task_blueprint import task_blueprint

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
            .where(or_(JobLog.job_status == JobStatus.COMPLETED))
            .order_by(JobLog.created_at.desc())
        ).first()

        # Get opportunity ids that were updated after the latest job run
        latest_time = latest_job.created_at if latest_job else datetime(1970, 1, 1)

        opportunity_change_audits = self.db_session.scalars(
            select(OpportunityChangeAudit).where(OpportunityChangeAudit.updated_at > latest_time)
        ).all()

        for opp_change_audit in opportunity_change_audits:
            opportunity = opp_change_audit.opportunity

            # Store to OpportunityVersion table
            save_opportunity_version(self.db_session, opportunity)
