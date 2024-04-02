from typing import Type, TypeVar

from src.db.models.base import ApiSchemaTable
from src.db.models.lookup import Lookup

L = TypeVar("L", bound="LookupTable")


class LookupTable(ApiSchemaTable):
    __abstract__ = True

    @classmethod
    def from_lookup(cls: Type[L], lookup: Lookup) -> L:
        raise NotImplementedError(f"from_lookup must be implemented by {cls.__name__}")
