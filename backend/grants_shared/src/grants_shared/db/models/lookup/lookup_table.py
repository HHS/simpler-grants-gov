from typing import TypeVar

from grants_shared.db.models.base import Base
from grants_shared.db.models.lookup import Lookup

L = TypeVar("L", bound="LookupTable")


class LookupTable(Base):
    __abstract__ = True

    @classmethod
    def from_lookup(cls: type[L], lookup: Lookup) -> L:
        raise NotImplementedError(f"from_lookup must be implemented by {cls.__name__}")
