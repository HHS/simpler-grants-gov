import logging
from datetime import datetime

from sqlalchemy import select

from src.constants.lookup_constants import JobStatus
from src.db.models.opportunity_models import OpportunityChangeAudit
from src.db.models.task_models import JobLog
from src.services.opportunities_v1.opportunity_version import save_opportunity_version
from src.task.task import Task

logger = logging.getLogger(__name__)


class StoreOpportunityVersionTask(Task):
    def run_task(self) -> None:
        # Get latest job that run
        latest_job = self.db_session.scalars(
            select(JobLog)
            .where(JobLog.job_type == self.cls_name())
            .where(JobLog.job_status == JobStatus.COMPLETED)
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
