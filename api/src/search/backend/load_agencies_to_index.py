import copy
from collections.abc import Sequence
from enum import StrEnum
from typing import Any

from grants_shared.adapters import db
from grants_shared.util.datetime_util import get_now_us_eastern_datetime
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import search
from src.adapters.search.opensearch_client import DEFAULT_INDEX_ANALYSIS
from src.api.agencies_v1.agency_schema import AgencyV1Schema
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.agency_models import Agency
from src.services.agencies_v1.get_agencies import _construct_active_inner_query
from src.task.task import Task, logger
from src.util.env_config import PydanticBaseEnvConfig

SCHEMA = AgencyV1Schema()

# The default analyzer stems every token ("housing" becomes "hous"), which means a
# partially typed word won't always be a prefix of the token that got indexed. Agency
# names are additionally indexed unstemmed so that search-as-you-type keeps matching
# no matter how much of a word the user has typed so far.
AGENCY_INDEX_ANALYSIS: dict[str, Any] = copy.deepcopy(DEFAULT_INDEX_ANALYSIS)
AGENCY_INDEX_ANALYSIS["analyzer"]["unstemmed"] = {
    "type": "custom",
    "filter": ["lowercase"],
    "tokenizer": "standard",
}

# Matches what dynamic mapping would produce for a string field, plus the unstemmed sub-field.
# The keyword sub-field is what agency name sorting is applied to.
#
# Only the sub-fields name an analyzer. Mapping a field explicitly doesn't opt it out of the
# index defaults, so `agency_name` itself is still analyzed by the `default` analyzer above
# and remains stemmed ("Department of Housing" indexes as depart/of/hous), while
# `agency_name.unstemmed` keeps the whole word.
# See: https://docs.opensearch.org/latest/analyzers/index/#analyzers-for-fields
AGENCY_NAME_MAPPING = {
    "type": "text",
    "fields": {
        "keyword": {"type": "keyword", "ignore_above": 256},
        "unstemmed": {"type": "text", "analyzer": "unstemmed"},
    },
}

# We explicitly map `opportunity_statuses` as a `keyword` field so that it supports
# exact match filtering, aggregations, and sorting
# See: https://docs.opensearch.org/docs/latest/field-types/supported-field-types/keyword/
AGENCY_INDEX_MAPPINGS = {
    "properties": {
        "opportunity_statuses": {"type": "keyword"},
        "agency_name": AGENCY_NAME_MAPPING,
        "top_level_agency": {"properties": {"agency_name": AGENCY_NAME_MAPPING}},
    }
}


class LoadAgenciesToIndexConfig(PydanticBaseEnvConfig):
    shard_count: int = Field(default=1, alias="LOAD_AGENCY_SEARCH_SHARD_COUNT")
    replica_count: int = Field(default=1, alias="LOAD_AGENCY_SEARCH_REPLICA_COUNT")

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
            shard_count=self.config.shard_count,
            replica_count=self.config.replica_count,
            analysis=AGENCY_INDEX_ANALYSIS,
            mappings=AGENCY_INDEX_MAPPINGS,
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

    def _get_agencies_by_status(self, status: OpportunityStatus) -> set[Agency]:
        """Fetch agencies based on the status."""
        agencies_subquery = (
            _construct_active_inner_query(Agency.agency_id, [status])
            .union(_construct_active_inner_query(Agency.top_level_agency_id, [status]))
            .subquery()
        )

        agency_id_stmt = select(agencies_subquery).distinct()
        return set(self.db_session.execute(agency_id_stmt).scalars())

    def load_agencies(self, agencies: Sequence[Agency]) -> None:
        logger.info("Loading agencies...")

        # Get agencies by opportunity status
        posted_agencies = self._get_agencies_by_status(OpportunityStatus.POSTED)
        forecasted_agencies = self._get_agencies_by_status(OpportunityStatus.FORECASTED)
        closed_agencies = self._get_agencies_by_status(OpportunityStatus.CLOSED)
        archived_agencies = self._get_agencies_by_status(OpportunityStatus.ARCHIVED)

        agencies_json = []
        for agency in agencies:
            logger.info(
                "Preparing agency for upload to search index",
                extra={"agency_id": agency.agency_id, "agency_code": agency.agency_code},
            )

            agency_json = SCHEMA.dump(agency)

            opportunity_statuses = []
            if agency.agency_id in posted_agencies:
                opportunity_statuses.append(OpportunityStatus.POSTED)

            if agency.agency_id in forecasted_agencies:
                opportunity_statuses.append(OpportunityStatus.FORECASTED)

            if agency.agency_id in closed_agencies:
                opportunity_statuses.append(OpportunityStatus.CLOSED)

            if agency.agency_id in archived_agencies:
                opportunity_statuses.append(OpportunityStatus.ARCHIVED)

            agency_json["opportunity_statuses"] = opportunity_statuses

            logger.info(
                "Assigned linked opportunity statuses to agency",
                extra={"agency_id": agency.agency_id, "opportunity_statuses": opportunity_statuses},
            )

            agencies_json.append(agency_json)

            self.increment(self.Metrics.RECORDS_LOADED)

        self.search_client.bulk_upsert(
            self.index_name,
            agencies_json,
            "agency_id",
        )
