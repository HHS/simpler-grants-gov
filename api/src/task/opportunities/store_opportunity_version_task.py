import logging
from datetime import datetime
from enum import StrEnum

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.constants.lookup_constants import JobStatus
from src.db.models.opportunity_models import OpportunityChangeAudit
from src.db.models.task_models import JobLog
from src.services.opportunities_v1.opportunity_version import save_opportunity_version
from src.task.task import Task

logger = logging.getLogger(__name__)


class StoreOpportunityVersionTask(Task):
    class Metrics(StrEnum):
        OPPORTUNITIES_VERSIONED = "opportunities_versioned"

    def run_task(self) -> None:
        with self.db_session.begin():
            self.process_opportunity_versions()

    def process_opportunity_versions(self) -> None:
        logger.info("Fetching opportunities to version")
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
            select(OpportunityChangeAudit)
            .where(OpportunityChangeAudit.updated_at > latest_time)
            .options(selectinload("*"))
        ).all()

        for opp_change_audit in opportunity_change_audits:
            log_extra = {
                "opportunity_id": opp_change_audit.opportunity_id,
            }
            logger.info("Preparing opportunity for versioning", extra=log_extra)

            # Store to OpportunityVersion table
            if save_opportunity_version(self.db_session, opp_change_audit.opportunity):
                self.increment(self.Metrics.OPPORTUNITIES_VERSIONED)
