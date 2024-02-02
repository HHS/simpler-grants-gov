import logging
from enum import Enum, IntEnum, StrEnum
from typing import Callable, Optional, Type, TypeVar

from src.db.models.lookup.lookup import LookupConfig
from src.db.models.lookup.lookup_table import LookupTable

logger = logging.getLogger(__name__)

L = TypeVar("L", bound=LookupTable)


class LookupRegistry:
    _lookup_registry: dict[Type[LookupTable], LookupConfig] = {}

    @classmethod
    def register_lookup(cls, lookup: LookupConfig) -> Callable[[Type[L]], Type[L]]:
        """
        Attach the lookup class mapping to a particular lookup table.

        Can be used as::

        @LookupRegistry.register_lookup(lookup_constants.MY_LOOKUP_CONFIG)
        class LkMyLookup(LookupTable):
            pass

        """

        def decorator(lookup_table: Type[L]) -> Type[L]:
            if lookup_table in cls._lookup_registry:
                raise Exception(
                    f"Cannot attach lookup mapping to table {lookup_table.get_table_name()}, table already registered"
                )

            cls._lookup_registry[lookup_table] = lookup

            return lookup_table

        return decorator

    @classmethod
    def _get_lookup_config(cls, lookup_table: Type[LookupTable]) -> LookupConfig:
        lookup_config = cls._lookup_registry.get(lookup_table)
        if lookup_config is None:
            raise Exception(
                f"Table {lookup_table.get_table_name()} does not have a registered lookup_config via register_lookup"
            )
        return lookup_config

    @classmethod
    def get_lookup_int_for_enum(
        cls, lookup_table: Type[LookupTable], lookup_enum: Optional[StrEnum | IntEnum]
    ) -> Optional[int]:
        """
        Given a Lookup Table + Enum, get the lookup int value to store in the DB
        """
        if lookup_enum is None:
            return None

        lookup_config = cls._get_lookup_config(lookup_table)

        return lookup_config.get_int_for_enum(lookup_enum)

    @classmethod
    def get_enum_for_lookup_int(
        cls, lookup_table: Type[LookupTable], lookup_val: Optional[int]
    ) -> Optional[Enum]:
        """
        Given a Lookup Table + lookup int, get the enum that is mapped to it
        """
        if lookup_val is None:
            return None

        lookup_config = cls._get_lookup_config(lookup_table)

        return lookup_config.get_enum_for_int(lookup_val)

    @classmethod
    def get_sync_values(cls) -> dict[Type[LookupTable], LookupConfig]:
        return cls._lookup_registry
