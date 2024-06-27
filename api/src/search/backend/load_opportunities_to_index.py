import logging
from enum import StrEnum
from typing import Iterator, Sequence

from pydantic import Field
from pydantic_settings import SettingsConfigDict
from sqlalchemy import select
from sqlalchemy.orm import noload, selectinload

import src.adapters.db as db
import src.adapters.search as search
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.task.task import Task
from src.util.datetime_util import get_now_us_eastern_datetime
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class LoadOpportunitiesToIndexConfig(PydanticBaseEnvConfig):
    model_config = SettingsConfigDict(env_prefix="LOAD_OPP_SEARCH_")

    shard_count: int = Field(default=1)  # LOAD_OPP_SEARCH_SHARD_COUNT
    replica_count: int = Field(default=1)  # LOAD_OPP_SEARCH_REPLICA_COUNT

    # TODO - these might make sense to come from some sort of opportunity-search-index-config?
    # look into this a bit more when we setup the search endpoint itself.
    alias_name: str = Field(default="opportunity-index-alias")  # LOAD_OPP_SEARCH_ALIAS_NAME
    index_prefix: str = Field(default="opportunity-index")  # LOAD_OPP_INDEX_PREFIX


class LoadOpportunitiesToIndex(Task):
    class Metrics(StrEnum):
        RECORDS_LOADED = "records_loaded"

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

    def run_task(self) -> None:
        # create the index
        self.search_client.create_index(
            self.index_name,
            shard_count=self.config.shard_count,
            replica_count=self.config.replica_count,
        )

        # load the records
        for opp_batch in self.fetch_opportunities():
            self.load_records(opp_batch)

        # handle aliasing of endpoints
        self.search_client.swap_alias_index(
            self.index_name, self.config.alias_name, delete_prior_indexes=True
        )

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
                .execution_options(yield_per=5000)
            )
            .scalars()
            .partitions()
        )

    def load_records(self, records: Sequence[Opportunity]) -> None:
        logger.info("Loading batch of opportunities...")
        schema = OpportunityV1Schema()
        json_records = []

        for record in records:
            logger.info(
                "Preparing opportunity for upload to search index",
                extra={
                    "opportunity_id": record.opportunity_id,
                    "opportunity_status": record.opportunity_status,
                },
            )
            json_records.append(schema.dump(record))
            self.increment(self.Metrics.RECORDS_LOADED)

        self.search_client.bulk_upsert(self.index_name, json_records, "opportunity_id")
