from typing import TypeVar

from src.db.models.api_schema_table import ApiSchemaTable
from src.db.models.lookup import Lookup

L = TypeVar("L", bound="LookupTable")


class LookupTable(ApiSchemaTable):
    __abstract__ = True

    @classmethod
    def from_lookup(cls: type[L], lookup: Lookup) -> L:
        raise NotImplementedError(f"from_lookup must be implemented by {cls.__name__}")
