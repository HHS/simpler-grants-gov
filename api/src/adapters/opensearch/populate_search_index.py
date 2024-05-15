from opensearchpy import OpenSearch

from src.adapters.db import PostgresDBClient
from src.api.opportunities_v0_1.opportunity_schemas import OpportunitySchema
from src.db.models.opportunity_models import Opportunity
import src.logging
import src.adapters.db as db

INDEX = "test-opportunity-index"

# https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/index-settings/
# TODO - for local, we'll probably be fine with 1 shard, 1 replica
# but when we get this non-local, we'll probably want a way to configure
# them via an env var and probably set several other fields
# Until we're in AWS, probably won't need to touch this
index_settings = {
    "settings": {
        "index": {
            # Note these are also the defaults
            "number_of_shards": 1,
            "number_of_replicas": 1
        }
    }
}

#
def create_index(index_name: str, opensearch_client: OpenSearch) -> None:
    # TODO - more config (ie. alias)

    # hacky approach to delete and remake it
    # We would not actually do it this way
    exist_response = opensearch_client.indices.exists(index=index_name)
    if exist_response:
        opensearch_client.indices.delete(index=index_name)

    # https://opensearch.org/docs/latest/api-reference/index-apis/create-index/
    response = opensearch_client.indices.create(index=index_name, body=index_settings)
    print(response)

def insert(opensearch_client: OpenSearch, db_session: db.Session) -> None:
    opportunities = db_session.query(Opportunity)
    for opp in opportunities:

        # Don't index drafts or opportunities without a status
        if opp.is_draft or opp.opportunity_status is None:
            continue

        body = OpportunitySchema().dump(opp)
        print(body)

        # TODO - use the bulk endpoint instead
        # however that requires making raw JSON text - which I'll do later
        opensearch_client.index(index=INDEX, body=body, id=opp.opportunity_id, refresh=True)


def get_client() -> OpenSearch:
    # TODO - I'm certain we'll need to adjust these values (turning off auth non-locally is bad)
    # TODO - make a config class for these

    # If you are running inside of docker, set the host to host.docker.internal
    return OpenSearch(
            hosts=[{"host": "localhost", "port": 9200}],
            http_compress=True,
            use_ssl=False,
            verify_certs=False,
            ssl_assert_hostname=False,
            ssl_show_warn=False
        )

def main():
    with src.logging.init("opensearch-load"):
        opensearch_client = get_client()

        create_index(INDEX, opensearch_client)

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            insert(opensearch_client, db_session)


main()