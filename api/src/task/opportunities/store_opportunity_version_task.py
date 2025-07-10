import logging
from datetime import datetime
from enum import StrEnum

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.constants.lookup_constants import JobStatus
from src.db.models.opportunity_models import OpportunityChangeAudit
from src.db.models.task_models import JobLog
from src.services.opportunities_v1.opportunity_version import save_opportunity_version
from src.task.task import Task
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class StoreOpportunityVersionConfig(PydanticBaseEnvConfig):
    store_opportunity_version_batch_size: int = 5000


class StoreOpportunityVersionTask(Task):

    def __init__(self, db_session: db.Session):
        super().__init__(db_session)
        self.has_unprocessed_records = True
        self.config = StoreOpportunityVersionConfig()

    class Metrics(StrEnum):
        OPPORTUNITIES_VERSIONED = "opportunities_versioned"

    def run_task(self) -> None:

        batch_num = 0
        while True:
            batch_num += 1
            with self.db_session.begin():
                self.process_opportunity_versions()
                logger.info("Ran a batch of store opportunity versions - committing results")

            if not self.has_unprocessed_records:
                break

            if batch_num > 100:
                logger.error(
                    "Job has run 100 batches, stopping further processing in case job is stuck"
                )
                break

            # As a safety net, expire all references in the session
            # after running. This avoids any potential complexities in
            # cached data between separate subtasks running.
            # By default sessions actually do this when committing, but
            # our db session creation logic disables it, so it's the ordinary behavior.
            self.db_session.expire_all()

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
            # We fetch a lot of data here, so we process in batches
            # in case we're doing a backfill. Most times this won't really matter.
            .limit(self.config.store_opportunity_version_batch_size)
        ).all()

        for opp_change_audit in opportunity_change_audits:
            log_extra = {
                "opportunity_id": opp_change_audit.opportunity_id,
            }
            logger.info("Preparing opportunity for versioning", extra=log_extra)

            # Store to OpportunityVersion table
            if save_opportunity_version(self.db_session, opp_change_audit.opportunity):
                self.increment(self.Metrics.OPPORTUNITIES_VERSIONED)

        # If the batch we grabbed has fewer than the batch size, we know we've
        # reached the end of processing.
        if len(opportunity_change_audits) < self.config.store_opportunity_version_batch_size:
            self.has_unprocessed_records = False
