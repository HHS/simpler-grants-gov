from enum import StrEnum
from typing import Sequence

from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db, search
from src.api.agencies_v1.agency_schema import AgencyResponseSchema
from src.db.models.agency_models import Agency
from src.task.task import Task, logger
from src.util.datetime_util import get_now_us_eastern_datetime
from src.util.env_config import PydanticBaseEnvConfig

SCHEMA = AgencyResponseSchema()


class LoadAgenciesToIndexConfig(PydanticBaseEnvConfig):
    LOAD_AGENCY_SEARCH_SHARD_COUNT: int = Field(default=1)
    LOAD_AGENCY_SEARCH_REPLICA_COUNT: int = Field(default=1)

    alias_name: str = Field(default="agency-index-alias")
    index_prefix: str = Field(default="agency-index")


class LoadAgenciesToIndex(Task):
    class Metrics(StrEnum):
        RECORDS_LOADED = "records_loaded"

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        config: LoadAgenciesToIndexConfig | None = None,
    ) -> None:
        super().__init__(db_session)

        self.search_client = search_client
        if config is None:
            config = LoadAgenciesToIndexConfig()

        self.config = config

        current_timestamp = get_now_us_eastern_datetime().strftime("%Y-%m-%d_%H-%M-%S")
        self.index_name = f"{self.config.index_prefix}-{current_timestamp}"

    def run_task(self) -> None:
        logger.info("Creating search index")
        # create the index
        self.search_client.create_index(
            self.index_name,
            shard_count=self.config.LOAD_AGENCY_SEARCH_SHARD_COUNT,
            replica_count=self.config.LOAD_AGENCY_SEARCH_REPLICA_COUNT,
        )
        # load the records
        agencies = self.fetch_agencies()
        self.load_agencies(agencies)

        # handle aliasing of endpoints
        self.search_client.swap_alias_index(
            self.index_name,
            self.config.alias_name,
        )

        # cleanup old indexes
        self.search_client.cleanup_old_indices(self.config.index_prefix, [self.index_name])

    def fetch_agencies(self) -> Sequence[Agency]:
        """
        Fetch all agencies.
        """
        return self.db_session.execute(select(Agency).options(selectinload("*"))).scalars().all()

    def load_agencies(self, agencies: Sequence[Agency]) -> None:
        logger.info("Loading agencies...")

        agencies_json = []
        for agency in agencies:
            logger.info(
                "Preparing agency for upload to search index",
                extra={"agency_id": agency.agency_id, "agency_code": agency.agency_code},
            )
            agencies_json.append(SCHEMA.dump(agency))
            self.increment(self.Metrics.RECORDS_LOADED)

        self.search_client.bulk_upsert(
            self.index_name,
            agencies_json,
            "agency_id",
        )
