import logging
import uuid
from collections.abc import Iterator, Sequence
from enum import StrEnum

from opensearchpy.exceptions import ConnectionTimeout, TransportError
from pydantic import Field
from pydantic_settings import SettingsConfigDict
from sqlalchemy import select
from sqlalchemy.orm import noload, selectinload
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

import src.adapters.db as db
import src.adapters.search as search
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.task.task import Task
from src.util.datetime_util import get_now_us_eastern_datetime, utcnow
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class LoadOpportunitiesToIndexConfig(PydanticBaseEnvConfig):
    model_config = SettingsConfigDict(env_prefix="LOAD_OPP_SEARCH_")

    shard_count: int = Field(default=1)  # LOAD_OPP_SEARCH_SHARD_COUNT
    replica_count: int = Field(default=1)  # LOAD_OPP_SEARCH_REPLICA_COUNT

    alias_name: str = Field(default="opportunity-index-alias")  # LOAD_OPP_SEARCH_ALIAS_NAME
    index_prefix: str = Field(default="opportunity-index")  # LOAD_OPP_INDEX_PREFIX


class LoadOpportunitiesToIndex(Task):
    class Metrics(StrEnum):
        RECORDS_LOADED = "records_loaded"
        TEST_RECORDS_SKIPPED = "test_records_skipped"

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        config: LoadOpportunitiesToIndexConfig | None = None,
    ) -> None:
        super().__init__(db_session)

        self.search_client = search_client
        if config is None:
            config = LoadOpportunitiesToIndexConfig()
        self.config = config

        current_timestamp = get_now_us_eastern_datetime().strftime("%Y-%m-%d_%H-%M-%S")
        self.index_name = f"{self.config.index_prefix}-{current_timestamp}"
        self.set_metrics({"index_name": self.index_name})
        self.start_time = utcnow()

    def run_task(self) -> None:
        # NOTE:
        # Incremental (changed-only) opportunity loading logic previously lived here.
        # It was removed as part of PR https://github.com/HHS/simpler-grants-gov/pull/7748 during code cleanup.
        # See that PR if incremental search support needs to be revived in the future.
        logger.info("Running full refresh")
        self.full_refresh()

    def full_refresh(self) -> None:
        # create the index
        self.search_client.create_index(
            self.index_name,
            shard_count=self.config.shard_count,
            replica_count=self.config.replica_count,
        )

        # load the records
        for opp_batch in self.fetch_opportunities():
            self.load_records(opp_batch, refresh=True)

        # handle aliasing of endpoints
        self.search_client.swap_alias_index(
            self.index_name,
            self.config.alias_name,
        )

        # cleanup old indexes
        self.search_client.cleanup_old_indices(self.config.index_prefix, [self.index_name])

    def fetch_opportunities(self) -> Iterator[Sequence[Opportunity]]:
        """
        Fetch the opportunities in batches. The iterator returned
        will give you each individual batch to be processed.

        Fetches all opportunities where:
            * is_draft = False
            * current_opportunity_summary is not None
        """
        return (
            self.db_session.execute(
                select(Opportunity)
                .join(CurrentOpportunitySummary)
                .where(
                    Opportunity.is_draft.is_(False),
                    CurrentOpportunitySummary.opportunity_status.isnot(None),
                )
                .options(selectinload("*"), noload(Opportunity.all_opportunity_summaries))
                # Top level agency won't be automatically fetched up front unless we add this
                # due to the odd nature of the relationship we have setup for the agency table
                # Adding it here improves performance when serializing to JSON as we won't need to
                # call out to the DB repeatedly.
                .options(
                    selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency)
                )
                .execution_options(yield_per=1000)
            )
            .scalars()
            .partitions()
        )

    @retry(
        stop=stop_after_attempt(3),  # Retry up to 3 times
        wait=wait_fixed(2),  # Wait 2 seconds between retries
        retry=retry_if_exception_type(
            (TransportError, ConnectionTimeout)
        ),  # Retry on TransportError (including timeouts)
    )
    def load_records(self, records: Sequence[Opportunity], refresh: bool = False) -> set[uuid.UUID]:
        logger.info("Loading batch of opportunities...")

        schema = OpportunityV1Schema()

        batch_json_records = []
        batch_processed_opp_ids = set()
        for record in records:
            log_extra = {
                "opportunity_id": record.opportunity_id,
                "opportunity_status": record.opportunity_status,
            }
            logger.info("Preparing opportunity for upload to search index", extra=log_extra)

            # Skip opportunity if associated with a test agency
            if record.agency_record and record.agency_record.is_test_agency:
                logger.info(
                    "Skipping upload of opportunity as agency is a test agency",
                    extra=log_extra | {"agency": record.agency_code},
                )
                self.increment(self.Metrics.TEST_RECORDS_SKIPPED)
                # Add the skipped opportunity IDs to batch_processed_opp_ids to ensure they are not re-queued in the next cycle.
                batch_processed_opp_ids.add(record.opportunity_id)
                continue

            json_record = schema.dump(record)

            self.increment(self.Metrics.RECORDS_LOADED)
            batch_json_records.append(json_record)
            batch_processed_opp_ids.add(record.opportunity_id)

        # Bulk upsert for the current batch
        if batch_json_records:
            self.search_client.bulk_upsert(
                self.index_name,
                batch_json_records,
                "opportunity_id",
                refresh=refresh,
            )

        return batch_processed_opp_ids
