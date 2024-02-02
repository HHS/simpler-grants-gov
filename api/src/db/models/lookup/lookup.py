import dataclasses
from abc import ABC, ABCMeta, abstractmethod
from enum import IntEnum, StrEnum
from typing import Generic, Optional, TypeVar

T = TypeVar("T", StrEnum, IntEnum)


@dataclasses.dataclass
class Lookup(Generic[T], ABC, metaclass=ABCMeta):
    """
    A class which handles mapping a specific enum
    member to additional metadata.

    At the moment, it only specifies a lookup value in
    the DB, but we can expand this to include configuration
    for additional member-specific fields like whether the
    field is deprecated, or should be excluded from the API schema
    """

    lookup_enum: T
    lookup_val: int

    @abstractmethod
    def get_description(self) -> str:
        pass


class LookupStr(Lookup[StrEnum]):
    def get_description(self) -> str:
        return self.lookup_enum


class LookupInt(Lookup[IntEnum]):
    def get_description(self) -> str:
        return self.lookup_enum.name


class LookupConfig(Generic[T]):
    """
    Configuration object for storing lookup mapping
    information. Helps with the conversion of our
    enums to lookup integers in the DB, and vice-versa.
    """

    _enum_to_lookup_map: dict[T, Lookup]
    _int_to_lookup_map: dict[int, Lookup]

    def __init__(self, lookups: list[Lookup]) -> None:
        enum_types_seen = set()
        _enum_to_lookup_map: dict[T, Lookup] = {}
        _int_to_lookup_map: dict[int, Lookup] = {}

        for lookup in lookups:
            if lookup.lookup_enum in _enum_to_lookup_map:
                raise AttributeError(
                    f"Duplicate lookup_enum {lookup.lookup_enum} defined, {lookup} + {_enum_to_lookup_map[lookup.lookup_enum]}"
                )
            _enum_to_lookup_map[lookup.lookup_enum] = lookup

            if lookup.lookup_val <= 0:
                raise AttributeError(
                    f"Only positive lookup_val values are allowed, {lookup} not allowed"
                )

            if lookup.lookup_val in _int_to_lookup_map:
                raise AttributeError(
                    f"Duplicate lookup_val {lookup.lookup_val} defined, {lookup} + {_int_to_lookup_map[lookup.lookup_val]}"
                )
            _int_to_lookup_map[lookup.lookup_val] = lookup

            enum_types_seen.add(lookup.lookup_enum.__class__)

        # Verify that for each enum in the config
        # that all of the values were mapped
        expected_enum_members = set()
        for enum_type_seen in enum_types_seen:
            expected_enum_members.update([e for e in enum_type_seen])

        diff = expected_enum_members.difference(_enum_to_lookup_map)
        if len(diff) > 0:
            raise AttributeError(
                f"Lookup config must define a mapping for all enum values, the following were missing: {diff}"
            )

        self._enum_to_lookup_map: dict[T, Lookup] = _enum_to_lookup_map
        self._int_to_lookup_map: dict[int, Lookup] = _int_to_lookup_map

    def get_lookups(self) -> list[Lookup]:
        return [lk for lk in self._enum_to_lookup_map.values()]

    def get_int_for_enum(self, e: T) -> Optional[int]:
        """
        Given an enum, get the lookup int for it in the DB
        """
        lookup = self._enum_to_lookup_map.get(e)
        if lookup is None:
            return None

        return lookup.lookup_val

    def get_lookup_for_int(self, num: int) -> Optional[Lookup]:
        """
        Given a lookup int, get the lookup for it
        """
        return self._int_to_lookup_map.get(num)

    def get_enum_for_int(self, num: int) -> Optional[T]:
        """
        Given a lookup int, get the enum for it (via the lookup object)
        """
        lookup = self.get_lookup_for_int(num)
        if lookup is None:
            return None
        return lookup.lookup_enum
