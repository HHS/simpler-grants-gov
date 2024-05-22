import uuid

import pytest

########################################################################
# These tests are primarily looking to validate
# that our wrappers around the OpenSearch client
# are being used correctly / account for error cases correctly.
#
# We are not validating all the intricacies of OpenSearch itself.
########################################################################


@pytest.fixture
def generic_index(search_client):
    # This is very similar to the opportunity_index fixture, but
    # is reused per unit test rather than a global value
    index_name = f"test-index-{uuid.uuid4().int}"

    search_client.create_index(index_name)

    try:
        yield index_name
    finally:
        # Try to clean up the index at the end
        search_client.delete_index(index_name)


def test_create_and_delete_index_duplicate(search_client):
    index_name = f"test-index-{uuid.uuid4().int}"

    search_client.create_index(index_name)
    with pytest.raises(Exception, match="already exists"):
        search_client.create_index(index_name)

    # Cleanup the index
    search_client.delete_index(index_name)
    with pytest.raises(Exception, match="no such index"):
        search_client.delete_index(index_name)


def test_bulk_upsert(search_client, generic_index):
    records = [
        {"id": 1, "title": "Green Eggs & Ham", "notes": "why are the eggs green?"},
        {"id": 2, "title": "The Cat in the Hat", "notes": "silly cat wears a hat"},
        {"id": 3, "title": "One Fish, Two Fish, Red Fish, Blue Fish", "notes": "fish"},
    ]

    search_client.bulk_upsert(generic_index, records, primary_key_field="id")

    # Verify the records are in the index
    for record in records:
        assert search_client._client.get(generic_index, record["id"])["_source"] == record

    # Can update + add more
    records = [
        {"id": 1, "title": "Green Eggs & Ham", "notes": "Sam, eat the eggs"},
        {"id": 2, "title": "The Cat in the Hat", "notes": "watch the movie"},
        {"id": 3, "title": "One Fish, Two Fish, Red Fish, Blue Fish", "notes": "colors & numbers"},
        {"id": 4, "title": "How the Grinch Stole Christmas", "notes": "who"},
    ]
    search_client.bulk_upsert(generic_index, records, primary_key_field="id")

    for record in records:
        assert search_client._client.get(generic_index, record["id"])["_source"] == record


def test_swap_alias_index(search_client, generic_index):
    alias_name = f"tmp-alias-{uuid.uuid4().int}"

    # Populate the generic index, we won't immediately use this one
    records = [
        {"id": 1, "data": "abc123"},
        {"id": 2, "data": "def456"},
        {"id": 3, "data": "xyz789"},
    ]
    search_client.bulk_upsert(generic_index, records, primary_key_field="id")

    # Create a different index that we'll attach to the alias first.
    tmp_index = f"test-tmp-index-{uuid.uuid4().int}"
    search_client.create_index(tmp_index)
    # Add a few records
    tmp_index_records = [
        {"id": 1, "data": "abc123"},
        {"id": 2, "data": "xyz789"},
    ]
    search_client.bulk_upsert(tmp_index, tmp_index_records, primary_key_field="id")

    # Set the alias
    search_client.swap_alias_index(tmp_index, alias_name, delete_prior_indexes=True)

    # Can search by this alias and get records from the tmp index
    resp = search_client.search(alias_name, {})
    resp_records = [record["_source"] for record in resp["hits"]["hits"]]
    assert resp_records == tmp_index_records

    # Swap the index to the generic one + delete the tmp one
    search_client.swap_alias_index(generic_index, alias_name, delete_prior_indexes=True)

    resp = search_client.search(alias_name, {})
    resp_records = [record["_source"] for record in resp["hits"]["hits"]]
    assert resp_records == records

    # Verify the tmp one was deleted
    assert search_client._client.indices.exists(tmp_index) is False
