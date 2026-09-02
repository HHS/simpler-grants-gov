import logging
import uuid
from collections.abc import Iterator, Sequence
from enum import StrEnum

import grants_shared.adapters.db as db
from grants_shared.util.datetime_util import get_now_us_eastern_datetime, utcnow
from opensearchpy.exceptions import ConnectionTimeout, TransportError
from pydantic import Field
from pydantic_settings import SettingsConfigDict
from sqlalchemy import delete, select, update
from sqlalchemy.orm import selectinload
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

import src.adapters.search as search
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunityChangeAudit,
    OpportunityIndexDeleteQueue,
    OpportunitySummary,
)
from src.task.task import Task
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
        OPENSEARCH_DOC_COUNT = "opensearch_doc_count"
        RECORDS_DELETED = "records_deleted"

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        config: LoadOpportunitiesToIndexConfig | None = None,
        full_refresh: bool = True,
    ) -> None:
        super().__init__(db_session)

        self.search_client = search_client
        if config is None:
            config = LoadOpportunitiesToIndexConfig()
        self.config = config
        self.do_full_refresh = full_refresh

        # Default to the alias; full_refresh() sets this to a new timestamped index
        # before writing so that incremental writes always land on the live alias.
        self.index_name = self.config.alias_name
        self.start_time = utcnow()

    def run_task(self) -> None:
        # NOTE: incremental_refresh requires the search alias to already exist.
        # A full_refresh must have run at least once before incremental can be used.
        # incremental_refresh() enforces this with an explicit alias_exists check.
        if self.do_full_refresh:
            logger.info("Running full refresh")
            self.full_refresh()
        else:
            logger.info("Running incremental refresh")
            self.incremental_refresh()

        self._emit_doc_count()

    def full_refresh(self) -> None:
        # Override self.index_name with a fresh timestamped index for this run.
        # load_records() uses self.index_name, so it writes to the new index;
        # incremental_refresh() leaves self.index_name as the alias by default.
        current_timestamp = get_now_us_eastern_datetime().strftime("%Y-%m-%d_%H-%M-%S")
        self.index_name = f"{self.config.index_prefix}-{current_timestamp}"
        self.set_metrics({"index_name": self.index_name})

        # create the index
        self.search_client.create_index(
            self.index_name,
            shard_count=self.config.shard_count,
            replica_count=self.config.replica_count,
        )

        # load the records and mark each batch as loaded
        for opp_batch in self.fetch_opportunities():
            indexed_ids = self.load_records(opp_batch, refresh=True)
            self._mark_loaded_to_search(indexed_ids)

        # handle aliasing of endpoints
        self.search_client.swap_alias_index(
            self.index_name,
            self.config.alias_name,
        )

        # cleanup old indexes
        self.search_client.cleanup_old_indices(self.config.index_prefix, [self.index_name])

    def incremental_refresh(self) -> None:
        """Re-index only opportunities whose change-audit record is not yet loaded.

        Raises RuntimeError if the search alias does not exist yet — a full refresh
        must run first to create the index and wire up the alias.
        """
        if not self.search_client.alias_exists(self.config.alias_name):
            raise RuntimeError(
                f"Search alias '{self.config.alias_name}' does not exist. "
                "Run a full refresh first to initialize the index."
            )

        for opp_batch in self.fetch_changed_opportunities():
            indexed_ids = self.load_records(opp_batch, refresh=True)
            self._mark_loaded_to_search(indexed_ids)

        self._process_delete_queue()

    def _mark_loaded_to_search(self, opportunity_ids: set[uuid.UUID]) -> None:
        """Set is_loaded_to_search = True for successfully indexed opportunities."""
        if not opportunity_ids:
            return
        self.db_session.execute(
            update(OpportunityChangeAudit)
            .where(OpportunityChangeAudit.opportunity_id.in_(opportunity_ids))
            .values(is_loaded_to_search=True)
        )
        self.db_session.flush()

    def _process_delete_queue(self) -> None:
        """Delete queued opportunity IDs from the search index and clear the queue on success."""
        queue_records = self.db_session.scalars(select(OpportunityIndexDeleteQueue)).all()
        if not queue_records:
            return

        ids_to_delete = [r.opportunity_id for r in queue_records]
        try:
            self.search_client.bulk_delete(self.config.alias_name, ids_to_delete, refresh=True)
            self.increment(self.Metrics.RECORDS_DELETED, len(ids_to_delete))
            # Only clear the queue after a confirmed successful delete
            self.db_session.execute(
                delete(OpportunityIndexDeleteQueue).where(
                    OpportunityIndexDeleteQueue.opportunity_id.in_(ids_to_delete)
                )
            )
            self.db_session.flush()
            logger.info(
                "Deleted opportunities from search index",
                extra={"count": len(ids_to_delete)},
            )
        except Exception:
            logger.exception(
                "Failed to delete opportunities from search index; records remain in queue for next cycle",
                extra={"count": len(ids_to_delete)},
            )

    def _emit_doc_count(self) -> None:
        """Emit the total number of documents in the search index after this run."""
        resp = self.search_client.search(self.config.alias_name, {"size": 0})
        self.set_metrics({self.Metrics.OPENSEARCH_DOC_COUNT: resp.total_records})

    def _opportunity_query_options(self) -> list:
        """Shared selectinload options for opportunity queries."""
        return [
            # Opportunity summary
            selectinload(Opportunity.current_opportunity_summary)
            .selectinload(CurrentOpportunitySummary.opportunity_summary)
            .options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            # Assistance listing number
            selectinload(Opportunity.opportunity_assistance_listings),
            # Agency
            selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
        ]

    def fetch_opportunities(self) -> Iterator[Sequence[Opportunity]]:
        """
        Fetch all indexable opportunities in batches (full refresh).

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
                .options(*self._opportunity_query_options())
                .execution_options(yield_per=1000)
            )
            .scalars()
            .partitions()
        )

    def fetch_changed_opportunities(self) -> Iterator[Sequence[Opportunity]]:
        """
        Fetch only opportunities whose change-audit record has not been loaded to search.

        Used by incremental_refresh to avoid re-indexing the full set every cycle.
        """
        return (
            self.db_session.execute(
                select(Opportunity)
                .join(CurrentOpportunitySummary)
                .join(
                    OpportunityChangeAudit,
                    Opportunity.opportunity_id == OpportunityChangeAudit.opportunity_id,
                )
                .where(
                    Opportunity.is_draft.is_(False),
                    CurrentOpportunitySummary.opportunity_status.isnot(None),
                    OpportunityChangeAudit.is_loaded_to_search.isnot(True),
                )
                .options(*self._opportunity_query_options())
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
    def load_records(
        self,
        records: Sequence[Opportunity],
        refresh: bool = False,
    ) -> set[uuid.UUID]:
        """Upsert a batch of opportunities into the search index.

        Writes to self.index_name — the alias by default (incremental), or the
        new timestamped index set by full_refresh() before it starts loading.

        Returns the set of opportunity IDs that were processed (indexed or skipped as
        test agencies). Callers use the returned IDs to mark change-audit records as
        loaded so those opportunities are not re-queued on the next incremental cycle.
        """
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
