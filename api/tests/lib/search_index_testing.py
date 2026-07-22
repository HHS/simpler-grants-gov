import contextlib
import uuid


@contextlib.contextmanager
def create_isolated_search_index(search_client, search_index_prefix, mappings: dict | None = None):

    index_name = f"{search_index_prefix}-{uuid.uuid4().int}"

    search_client.create_index(index_name, mappings=mappings)

    try:
        yield index_name
    finally:
        search_client.delete_index(search_index_prefix + "-*")