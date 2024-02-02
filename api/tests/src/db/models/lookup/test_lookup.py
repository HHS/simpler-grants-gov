from enum import StrEnum

import pytest

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.db.models import metadata
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


def test_lookup_columns_named_in_db_correctly():
    """
    If you are seeing this fail, here's an example of a valid one (context below)::

    pay_type: Mapped[PayType] = mapped_column(
        "pay_type_id",  # <<< Make sure to specifically define the column name as the first parameter
        LookupColumn(LkAdditionalPayType),
        ForeignKey(LkAdditionalPayType.additional_pay_type_id),
        nullable=False,
    )

    We want our lookup columns to always be named `<lookup_type>_id` in the DB
    so that it's clear they are an ID pointing to another table and not the actual value.

    It's fine if our in-code value doesn't have ID, as we aren't working with an ID,
    we are instead working with the enum directly.

    """

    # This will validate the behavior of all columns in every table derived
    # from the PostgresBase class which is everything we'll ever generate migrations for
    for table in metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, LookupColumn):
                assert column.name.endswith(
                    "_id"
                ), f"Lookup column {table.name}.{column.name} must be named with '_id' suffix"
