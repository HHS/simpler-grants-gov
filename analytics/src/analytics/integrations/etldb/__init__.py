"""Read and write data from/to delivery metrics database."""

__all__ = [
    "initialize_database",
    "sync_data",
]

from analytics.integrations.etldb.main import (
    initialize_database,
    sync_data,
)
