import logging
from typing import Any, Sequence

import opensearchpy

from src.adapters.search.opensearch_config import OpensearchConfig, get_opensearch_config
from src.adapters.search.opensearch_response import SearchResponse

logger = logging.getLogger(__name__)

# By default, we'll override the default analyzer+tokenization
# for a search index. You can provide your own when calling create_index
DEFAULT_INDEX_ANALYSIS = {
    "analyzer": {
        "default": {
            "type": "custom",
            "filter": ["lowercase", "custom_stemmer"],
            "tokenizer": "standard",
        }
    },
    # Change the default stemming to use snowball which handles plural
    # queries better than the default
    # TODO - there are a lot of stemmers, we should take some time to figure out
    #        which one works best with our particular dataset. Snowball is really
    #        basic and naive (literally just adjusting suffixes on words in common patterns)
    #        which might be fine generally, but we work with a lot of acronyms
    #        and should verify that doesn't cause any issues.
    # see: https://opensearch.org/docs/latest/analyzers/token-filters/index/
    "filter": {"custom_stemmer": {"type": "snowball", "name": "english"}},
}


class SearchClient:
    def __init__(self, opensearch_config: OpensearchConfig | None = None) -> None:
        if opensearch_config is None:
            opensearch_config = get_opensearch_config()

        # See: https://opensearch.org/docs/latest/clients/python-low-level/ for more details
        self._client = opensearchpy.OpenSearch(**_get_connection_parameters(opensearch_config))

    def create_index(
        self,
        index_name: str,
        *,
        shard_count: int = 1,
        replica_count: int = 1,
        analysis: dict | None = None
    ) -> None:
        """
        Create an empty search index
        """

        # Allow the user to adjust how the index analyzer + tokenization works
        # but also have a general default.
        if analysis is None:
            analysis = DEFAULT_INDEX_ANALYSIS

        body = {
            "settings": {
                "index": {"number_of_shards": shard_count, "number_of_replicas": replica_count},
                "analysis": analysis,
            },
        }

        logger.info("Creating search index %s", index_name, extra={"index_name": index_name})
        self._client.indices.create(index_name, body=body)

    def delete_index(self, index_name: str) -> None:
        """
        Delete an index. Can also delete all indexes via a prefix.
        """
        logger.info("Deleting search index %s", index_name, extra={"index_name": index_name})
        self._client.indices.delete(index=index_name)

    def bulk_upsert(
        self,
        index_name: str,
        records: Sequence[dict[str, Any]],
        primary_key_field: str,
        *,
        refresh: bool = True
    ) -> None:
        """
        Bulk upsert records to an index

        See: https://opensearch.org/docs/latest/api-reference/document-apis/bulk/ for details
        In this method we only use the "index" operation which creates or updates a record
        based on the id value.
        """

        bulk_operations = []

        for record in records:
            # For each record, we create two entries in the bulk operation list
            # which include the unique ID + the actual record on separate lines
            # When this is sent to the search index, this will send two lines like:
            #
            # {"index": {"_id": 123}}
            # {"opportunity_id": 123, "opportunity_title": "example title", ...}
            bulk_operations.append({"index": {"_id": record[primary_key_field]}})
            bulk_operations.append(record)

        logger.info(
            "Upserting records to %s",
            index_name,
            extra={"index_name": index_name, "record_count": int(len(bulk_operations) / 2)},
        )
        self._client.bulk(index=index_name, body=bulk_operations, refresh=refresh)

    def swap_alias_index(
        self, index_name: str, alias_name: str, *, delete_prior_indexes: bool = False
    ) -> None:
        """
        For a given index, set it to the given alias. If any existing index(es) are
        attached to the alias, remove them from the alias.

        This operation is done atomically.
        """
        extra = {"index_name": index_name, "index_alias": alias_name}
        logger.info("Swapping index that backs alias %s", alias_name, extra=extra)

        existing_index_mapping = self._client.cat.aliases(alias_name, format="json")
        existing_indexes = [i["index"] for i in existing_index_mapping]

        logger.info(
            "Found existing indexes", extra=extra | {"existing_indexes": ",".join(existing_indexes)}
        )

        actions = [{"add": {"index": index_name, "alias": alias_name}}]

        for index in existing_indexes:
            actions.append({"remove": {"index": index, "alias": alias_name}})

        self._client.indices.update_aliases({"actions": actions})

        # Cleanup old indexes now that they aren't connected to the alias
        if delete_prior_indexes:
            for index in existing_indexes:
                self.delete_index(index)

    def search_raw(self, index_name: str, search_query: dict) -> dict:
        # Simple wrapper around search if you don't want the request or response
        # object handled in any special way.
        return self._client.search(index=index_name, body=search_query)

    def search(
        self, index_name: str, search_query: dict, include_scores: bool = True
    ) -> SearchResponse:
        response = self._client.search(index=index_name, body=search_query)
        return SearchResponse.from_opensearch_response(response, include_scores)


def _get_connection_parameters(opensearch_config: OpensearchConfig) -> dict[str, Any]:
    # TODO - we'll want to add the AWS connection params here when we set that up
    # See: https://opensearch.org/docs/latest/clients/python-low-level/#connecting-to-amazon-opensearch-serverless

    return dict(
        hosts=[{"host": opensearch_config.host, "port": opensearch_config.port}],
        http_compress=True,
        use_ssl=opensearch_config.use_ssl,
        verify_certs=opensearch_config.verify_certs,
        ssl_assert_hostname=False,
        ssl_show_warn=False,
    )
