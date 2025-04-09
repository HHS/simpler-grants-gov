import base64
import itertools
import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from enum import StrEnum
from typing import Iterator, Sequence

from opensearchpy.exceptions import ConnectionTimeout, TransportError
from pydantic import Field
from pydantic_settings import SettingsConfigDict
from sqlalchemy import select, update
from sqlalchemy.orm import noload, selectinload
from sqlalchemy.sql import Select
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed
from tika import parser

import src.adapters.db as db
import src.adapters.search as search
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunityAttachment,
    OpportunityChangeAudit,
)
from src.task.task import Task
from src.util import file_util
from src.util.datetime_util import get_now_us_eastern_datetime, utcnow
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

ALLOWED_ATTACHMENT_SUFFIXES = set(
    ["txt", "pdf", "docx", "doc", "xlsx", "xlsm", "html", "htm", "pptx", "ppt", "rtf"]
)


class LoadOpportunitiesToIndexConfig(PydanticBaseEnvConfig):
    model_config = SettingsConfigDict(env_prefix="LOAD_OPP_SEARCH_")

    shard_count: int = Field(default=1)  # LOAD_OPP_SEARCH_SHARD_COUNT
    replica_count: int = Field(default=1)  # LOAD_OPP_SEARCH_REPLICA_COUNT

    # TODO - these might make sense to come from some sort of opportunity-search-index-config?
    # look into this a bit more when we setup the search endpoint itself.
    alias_name: str = Field(default="opportunity-index-alias")  # LOAD_OPP_SEARCH_ALIAS_NAME
    index_prefix: str = Field(default="opportunity-index")  # LOAD_OPP_INDEX_PREFIX

    enable_opportunity_attachment_pipeline: bool = Field(
        default=False, alias="ENABLE_OPPORTUNITY_ATTACHMENT_PIPELINE"
    )

    incremental_load_batch_size: int = Field(default=1000)
    incremental_load_max_process_time: int = Field(default=3000)
    # Configurable max worker. Set default to ThreaPoolExecutor default.
    # See: https://docs.python.org/dev/library/concurrent.futures.html#concurrent.futures.ThreadPoolExecutor
    incremental_load_max_workers: int = Field(default=(os.cpu_count() or 1) + 4)
    tika_url: str | None = Field(default=None, alias="LOAD_OPP_SEARCH_TIKA_URL")


class LoadOpportunitiesToIndex(Task):
    class Metrics(StrEnum):
        RECORDS_LOADED = "records_loaded"
        TEST_RECORDS_SKIPPED = "test_records_skipped"
        BATCHES_PROCESSED = "batches_processed"

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        is_full_refresh: bool = True,
        config: LoadOpportunitiesToIndexConfig | None = None,
    ) -> None:
        super().__init__(db_session)

        self.search_client = search_client
        self.is_full_refresh = is_full_refresh
        if config is None:
            config = LoadOpportunitiesToIndexConfig()
        self.config = config

        if is_full_refresh:
            current_timestamp = get_now_us_eastern_datetime().strftime("%Y-%m-%d_%H-%M-%S")
            self.index_name = f"{self.config.index_prefix}-{current_timestamp}"
        else:
            self.index_name = self.config.alias_name
        self.set_metrics({"index_name": self.index_name})
        self.start_time = utcnow()

    def run_task(self) -> None:
        logger.info("Creating multi-attachment pipeline")
        self._create_multi_attachment_pipeline()
        if self.is_full_refresh:
            logger.info("Running full refresh")
            self.full_refresh()
        else:
            logger.info("Running incremental load")
            self.incremental_updates_and_deletes()

    def _create_multi_attachment_pipeline(self) -> None:
        """
        Create multi-attachment processor
        """
        pipeline = {
            "description": "Extract attachment information",
            "processors": [
                {
                    "foreach": {
                        "field": "attachments",
                        "processor": {
                            "attachment": {
                                "target_field": "_ingest._value.attachment",
                                "field": "_ingest._value.data",
                            }
                        },
                        "ignore_missing": True,
                    }
                },
                # After we've done the above processing to send the base64
                # encoded file to OpenSearch, remove the raw base64 "data"
                # field from what we actually index as it's not useful
                # and will bloat the size of our index.
                {
                    "foreach": {
                        "field": "attachments",
                        "processor": {
                            "remove": {
                                "field": "_ingest._value.data",
                            }
                        },
                        "ignore_missing": True,
                    }
                },
            ],
        }

        self.search_client.put_pipeline(pipeline, "multi-attachment")

    def incremental_updates_and_deletes(self) -> None:
        existing_opportunity_ids = self.fetch_existing_opportunity_ids_in_index()
        # Handle updates/inserts
        self._handle_incremental_upserts(existing_opportunity_ids)

        # Handle deletes
        self._handle_incremental_delete(existing_opportunity_ids)

    def _build_opportunities_to_process_query(self) -> Select:
        return (
            select(Opportunity)
            .join(OpportunityChangeAudit)
            .join(CurrentOpportunitySummary)
            .where(
                Opportunity.is_draft.is_(False),
                CurrentOpportunitySummary.opportunity_status.isnot(None),
                OpportunityChangeAudit.is_loaded_to_search.isnot(True),
            )
            .order_by(Opportunity.created_at.desc())
            .options(selectinload("*"), noload(Opportunity.all_opportunity_summaries))
            .limit(self.config.incremental_load_batch_size)
        )

    def _handle_incremental_upserts(self, existing_opportunity_ids: set[int]) -> None:
        """Handle updates/inserts of opportunities into the search index when running incrementally"""
        while True:
            # Check elapsed_time before starting new batch processing
            elapsed_time = utcnow() - self.start_time

            if elapsed_time.total_seconds() > self.config.incremental_load_max_process_time:
                logger.info(
                    f"Elapsed time: {elapsed_time.total_seconds() / 60:.2f} minutes exceeded the limit. Stopping batch processing."
                )
                break

            # Fetch opportunities that need processing from the queue
            queued_opportunities = (
                self.db_session.execute(self._build_opportunities_to_process_query())
                .scalars()
                .all()
            )

            if len(queued_opportunities) == 0:
                logger.info("No opportunities remain in queue, exiting processing")
                break

            # Process updates and inserts
            processed_opportunity_ids = set()

            for opportunity in queued_opportunities:
                logger.info(
                    "Processing queued opportunity",
                    extra={
                        "opportunity_id": opportunity.opportunity_id,
                        "status": (
                            "update"
                            if opportunity.opportunity_id in existing_opportunity_ids
                            else "insert"
                        ),
                    },
                )

            # Determine how many opportunities each thread will process
            thread_count = self.config.incremental_load_max_workers
            batches = itertools.batched(queued_opportunities, thread_count, strict=False)

            # Create a thread pool for processing and uploading batch of opportunities in parallel
            with ThreadPoolExecutor(
                max_workers=self.config.incremental_load_max_workers
            ) as executor:
                futures = {executor.submit(self.load_records, batch) for batch in batches}

                for future in as_completed(futures):
                    batch_processed_opp_ids = future.result()
                    processed_opportunity_ids.update(batch_processed_opp_ids)

            logger.info(f"Indexed {len(processed_opportunity_ids)} opportunities")

            # refresh index
            self.search_client.refresh_index(self.index_name)

            # Update updated_at timestamp instead of deleting records
            self.db_session.execute(
                update(OpportunityChangeAudit)
                .where(OpportunityChangeAudit.opportunity_id.in_(processed_opportunity_ids))
                .values(is_loaded_to_search=True)
            )

            self.increment(self.Metrics.BATCHES_PROCESSED)

    def _handle_incremental_delete(self, existing_opportunity_ids: set[int]) -> None:
        """Handle deletion of opportunities when running incrementally

        Scenarios in which we delete an opportunity from the index:
        * An opportunity is no longer in our database
        * An opportunity is a draft (unlikely to ever happen, would require published->draft)
        * An opportunity loses its opportunity status
        * An opportunity has a test agency
        """

        # Fetch the opportunity IDs of opportunities we would expect to be in the index
        opportunity_ids_we_want_in_search: set[int] = set(
            self.db_session.execute(
                select(Opportunity.opportunity_id)
                .join(CurrentOpportunitySummary)
                .join(Agency, Opportunity.agency_code == Agency.agency_code, isouter=True)
                .where(
                    Opportunity.is_draft.is_(False),
                    CurrentOpportunitySummary.opportunity_status.isnot(None),
                    # We treat a null agency as fine
                    # We only want to filter out if is_test_agency=True specifically
                    Agency.is_test_agency.isnot(True),
                )
            )
            .scalars()
            .all()
        )

        opportunity_ids_to_delete = existing_opportunity_ids - opportunity_ids_we_want_in_search

        for opportunity_id in opportunity_ids_to_delete:
            logger.info(
                "Deleting opportunity from search",
                extra={"opportunity_id": opportunity_id, "status": "delete"},
            )

        if opportunity_ids_to_delete:
            self.search_client.bulk_delete(self.index_name, opportunity_ids_to_delete)

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

    def fetch_existing_opportunity_ids_in_index(self) -> set[int]:
        if not self.search_client.alias_exists(self.index_name):
            raise RuntimeError(
                "Alias %s does not exist, please run the full refresh job before the incremental job"
                % self.index_name
            )

        opportunity_ids: set[int] = set()

        for response in self.search_client.scroll(
            self.config.alias_name,
            {"size": 10000, "_source": ["opportunity_id"]},
            include_scores=False,
        ):
            for record in response.records:
                opportunity_ids.add(record["opportunity_id"])

        return opportunity_ids

    def filter_attachment(self, attachment: OpportunityAttachment) -> bool:
        file_suffix = attachment.file_name.lower().split(".")[-1]
        return file_suffix in ALLOWED_ATTACHMENT_SUFFIXES

    def get_attachment_json_for_opportunity(
        self, opp_attachments: list[OpportunityAttachment]
    ) -> list[dict]:

        attachments = []
        for att in opp_attachments:
            if not self.filter_attachment(att):
                continue
            with file_util.open_stream(att.file_location, "rb") as file:
                if self.config.tika_url:
                    file_data = parser.from_file(file, self.config.tika_url)
                    attachments.append(
                        {
                            "filename": att.file_name,
                            # tika adds extra \n chars before and after content so use .strip()
                            "data": file_data["content"].strip(),
                        }
                    )
                else:
                    file_content = file.read()
                    attachments.append(
                        {
                            "filename": att.file_name,
                            "data": base64.b64encode(file_content).decode("utf-8"),
                        }
                    )
        return attachments

    @retry(
        stop=stop_after_attempt(3),  # Retry up to 3 times
        wait=wait_fixed(2),  # Wait 2 seconds between retries
        retry=retry_if_exception_type(
            (TransportError, ConnectionTimeout)
        ),  # Retry on TransportError (including timeouts)
    )
    def load_records(self, records: Sequence[Opportunity], refresh: bool = False) -> set[int]:
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

            if self.config.enable_opportunity_attachment_pipeline:
                json_record["attachments"] = self.get_attachment_json_for_opportunity(
                    record.opportunity_attachments
                )

            self.increment(self.Metrics.RECORDS_LOADED)
            batch_json_records.append(json_record)
            batch_processed_opp_ids.add(record.opportunity_id)

        # Bulk upsert for the current batch
        if batch_json_records:
            self.search_client.bulk_upsert(
                self.index_name,
                batch_json_records,
                "opportunity_id",
                pipeline=None if self.config.tika_url else "multi-attachment",
                refresh=refresh,
            )

        return batch_processed_opp_ids
