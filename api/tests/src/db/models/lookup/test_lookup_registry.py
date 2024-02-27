from enum import StrEnum

import pytest
from sqlalchemy import Column, Integer

from src.db.models.lookup import Lookup, LookupConfig, LookupRegistry, LookupStr, LookupTable


class TmpEnum(StrEnum):
    A = "A"
    B = "B"
    C = "C"


class AnotherEnum(StrEnum):
    D = "D"
    E = "E"


TMP_LOOKUP_CONFIG = LookupConfig(
    [
        LookupStr(TmpEnum.A, 1),
        LookupStr(TmpEnum.B, 2),
        LookupStr(TmpEnum.C, 3),
    ]
)


class LkTmp(LookupTable):
    __abstract__ = True  # Mark it abstract so SQLAlchemy and Alembic ignore it
    __tablename__ = "lk_tmp"

    tmp_id: int = Column(Integer, primary_key=True)

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LookupTable":
        pass


def test_lookup_registry():
    try:
        # This is the equivalent of adding @LookupRegistry.register_lookup(TmpLookup)
        # on top of the LkTmp class, but without defining that at the module level
        # that way we can reuse those classes.
        LookupRegistry.register_lookup(TMP_LOOKUP_CONFIG)(LkTmp)

        sync_values = LookupRegistry.get_sync_values()
        assert LkTmp in sync_values  # Make sure it got added
        assert sync_values[LkTmp] is TMP_LOOKUP_CONFIG

        assert LookupRegistry.get_enum_for_lookup_int(LkTmp, 1) == TmpEnum.A
        assert LookupRegistry.get_enum_for_lookup_int(LkTmp, 2) == TmpEnum.B
        assert LookupRegistry.get_enum_for_lookup_int(LkTmp, 3) == TmpEnum.C
        assert LookupRegistry.get_enum_for_lookup_int(LkTmp, 0) is None
        assert LookupRegistry.get_enum_for_lookup_int(LkTmp, 4) is None
        assert LookupRegistry.get_enum_for_lookup_int(LkTmp, None) is None

        assert LookupRegistry.get_lookup_int_for_enum(LkTmp, TmpEnum.A) == 1
        assert LookupRegistry.get_lookup_int_for_enum(LkTmp, TmpEnum.B) == 2
        assert LookupRegistry.get_lookup_int_for_enum(LkTmp, TmpEnum.C) == 3
        assert LookupRegistry.get_lookup_int_for_enum(LkTmp, AnotherEnum.D) is None
        assert LookupRegistry.get_lookup_int_for_enum(LkTmp, AnotherEnum.E) is None
        assert LookupRegistry.get_lookup_int_for_enum(LkTmp, None) is None
    finally:
        # Because the registry is global, remove LkTmp
        # so it doesn't affect other tests that run
        del LookupRegistry._lookup_registry[LkTmp]

    # Verify we cleaned up properly
    assert LkTmp not in LookupRegistry.get_sync_values()


def test_lookup_member_not_registered():
    with pytest.raises(
        Exception, match="Table lk_tmp does not have a registered lookup_config via register_lookup"
    ):
        LookupRegistry.get_enum_for_lookup_int(LkTmp, 1)


def test_lookup_registry_duplicate_table():
    try:
        LookupRegistry.register_lookup(TMP_LOOKUP_CONFIG)(LkTmp)

        with pytest.raises(
            Exception,
            match="Cannot attach lookup mapping to table lk_tmp, table already registered",
        ):
            LookupRegistry.register_lookup(TMP_LOOKUP_CONFIG)(LkTmp)

    finally:
        # Because the registry is global, remove LkTmp
        # so it doesn't affect other tests that run
        del LookupRegistry._lookup_registry[LkTmp]

    # Verify we cleaned up properly
    assert LkTmp not in LookupRegistry.get_sync_values()
