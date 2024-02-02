from enum import IntEnum, StrEnum
from typing import Any, Type

from sqlalchemy import Integer
from sqlalchemy.types import TypeDecorator

from src.db.models.lookup import LookupRegistry, LookupTable


class LookupColumn(TypeDecorator):
    """
    A Postgres column decorator that wraps
    an integer column representing a lookup int.

    This takes in the LookupTable that the lookup value
    is stored in, and handles converting the Lookup object
    in-code into the integer in the DB automatically (and the reverse).
    """

    impl = Integer

    cache_ok = True

    def __init__(self, lookup_table: Type[LookupTable], *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self.lookup_table = lookup_table

    def process_bind_param(self, value: Any | None, dialect: Any) -> int | None:
        if value is None:
            return None

        if not isinstance(value, (StrEnum, IntEnum)):
            raise Exception(
                f"Cannot convert value of type {type(value)} for binding column in table {self.lookup_table.get_table_name()}"
            )

        return LookupRegistry.get_lookup_int_for_enum(self.lookup_table, value)

    def process_result_value(self, value: Any | None, dialect: Any) -> Any | None:
        if value is None:
            return None

        if not isinstance(value, int):
            raise Exception(
                f"Cannot process value from DB of type {type(value)} in table {self.lookup_table.get_table_name()}"
            )

        return LookupRegistry.get_enum_for_lookup_int(self.lookup_table, value)
