import logging
from enum import StrEnum

import grants_shared.adapters.db as db
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.db.models.agency_models import Agency
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunityChangeAudit,
    OpportunitySummary,
)
from src.services.opportunities_v1.opportunity_version import save_opportunity_version
from src.task.task import Task
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class StoreOpportunityVersionConfig(PydanticBaseEnvConfig):
    store_opportunity_version_batch_size: int = 500
    store_opportunity_version_batch_count: int = 250


class StoreOpportunityVersionTask(Task):

    def __init__(self, db_session: db.Session):
        super().__init__(db_session)
        self.has_unprocessed_records = True
        self.config = StoreOpportunityVersionConfig()

    class Metrics(StrEnum):
        OPPORTUNITIES_VERSIONED = "opportunities_versioned"
        BATCHES_PROCESSED = "batches_processed"

    def run_task(self) -> None:

        batch_num = 0
        while self.has_unprocessed_records:
            batch_num += 1
            self.increment(self.Metrics.BATCHES_PROCESSED)
            with self.db_session.begin():
                self.process_opportunity_versions()
                logger.info("Ran a batch of store opportunity versions - committing results")

            if batch_num > self.config.store_opportunity_version_batch_count:
                logger.error(
                    "Job has run %s batches, stopping further processing in case job is stuck",
                    self.config.store_opportunity_version_batch_count,
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

        opportunity_change_audits = self.db_session.scalars(
            select(OpportunityChangeAudit)
            .join(Opportunity)
            .where(OpportunityChangeAudit.is_loaded_to_version_table.isnot(True))
            # We filter drafts out of creating versions, so just don't fetch them.
            .where(Opportunity.is_draft.is_(False))
            .options(
                # The opportunity
                selectinload(OpportunityChangeAudit.opportunity).options(
                    # Opportunity summary
                    selectinload(Opportunity.current_opportunity_summary)
                    .selectinload(CurrentOpportunitySummary.opportunity_summary)
                    .options(
                        selectinload(OpportunitySummary.link_funding_instruments),
                        selectinload(OpportunitySummary.link_funding_categories),
                        selectinload(OpportunitySummary.link_applicant_types),
                    ),
                    # Attachments
                    selectinload(Opportunity.opportunity_attachments),
                    # Competitions
                    selectinload(Opportunity.competitions).options(
                        selectinload(Competition.competition_instructions),
                        selectinload(Competition.opportunity_assistance_listing),
                        selectinload(Competition.link_competition_open_to_applicant),
                        selectinload(Competition.competition_forms),
                    ),
                    # Assistance listing number
                    selectinload(Opportunity.opportunity_assistance_listings),
                    # Agency
                    selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
                )
            )
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
                logger.info("Opportunity has a new version", extra=log_extra)
                self.increment(self.Metrics.OPPORTUNITIES_VERSIONED)

            # Mark the change audit record so we don't pick it up again next batch
            opp_change_audit.is_loaded_to_version_table = True

        # If the batch we grabbed has fewer than the batch size, we know we've
        # reached the end of processing.
        if len(opportunity_change_audits) < self.config.store_opportunity_version_batch_size:
            self.has_unprocessed_records = False
