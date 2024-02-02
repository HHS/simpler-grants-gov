from enum import StrEnum

import pytest

from src.db.models.lookup import LookupConfig, LookupStr


class EnumX(StrEnum):
    A = "A"
    B = "B"


class EnumY(StrEnum):
    C = "C"
    D = "D"


class EnumZ(StrEnum):
    # Str values overlap with X and Y
    B = "B"
    C = "C"


def test_lookup_config():
    config = LookupConfig(
        [
            LookupStr(EnumX.A, 1),
            LookupStr(EnumX.B, 2),
            LookupStr(EnumY.C, 3),
            LookupStr(EnumY.D, 4),
        ]
    )

    assert config.get_int_for_enum(EnumX.A) == 1
    assert config.get_int_for_enum(EnumX.B) == 2
    assert config.get_int_for_enum(EnumY.C) == 3
    assert config.get_int_for_enum(EnumY.D) == 4

    assert config.get_enum_for_int(1) == EnumX.A
    assert config.get_enum_for_int(2) == EnumX.B
    assert config.get_enum_for_int(3) == EnumY.C
    assert config.get_enum_for_int(4) == EnumY.D


def test_lookup_config_duplicate_enum_str():
    with pytest.raises(AttributeError, match="Duplicate lookup_enum B defined"):
        LookupConfig(
            [
                LookupStr(EnumX.A, 1),
                LookupStr(EnumX.B, 2),
                LookupStr(EnumZ.B, 3),
            ]
        )


def test_lookup_config_duplicate_lookup_val():
    with pytest.raises(AttributeError, match="Duplicate lookup_val 1 defined"):
        LookupConfig(
            [
                LookupStr(EnumX.A, 1),
                LookupStr(EnumX.B, 1),
            ]
        )


def test_lookup_config_missing_mapping():
    with pytest.raises(
        AttributeError,
        match="Lookup config must define a mapping for all enum values, the following were missing: {<EnumX.B: 'B'>}",
    ):
        LookupConfig([LookupStr(EnumX.A, 1)])


def test_lookup_config_negative():
    with pytest.raises(
        AttributeError,
        match="Only positive lookup_val values are allowed",
    ):
        LookupConfig([LookupStr(EnumX.A, -1)])


def test_lookup_config_zero():
    with pytest.raises(
        AttributeError,
        match="Only positive lookup_val values are allowed",
    ):
        LookupConfig([LookupStr(EnumX.A, 0)])
