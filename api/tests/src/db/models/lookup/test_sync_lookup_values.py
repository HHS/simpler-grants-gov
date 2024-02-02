import logging
from enum import StrEnum
from typing import Type

import pytest
from sqlalchemy import inspect

import src.adapters.db as db
import src.db.models as db_models
from src.db.models.lookup import LookupConfig, LookupRegistry, LookupStr, LookupTable
from src.db.models.lookup.sync_lookup_values import sync_lookup_values
from src.db.models.lookup_models import LkOpportunityCategory
from tests.lib import db_testing


@pytest.fixture
def schema_no_lookup(monkeypatch) -> db.PostgresDBClient:
    """
    Create a test schema, if it doesn't already exist, and drop it after the
    test completes.

    This is similar to what the db_client fixture does but does not create any tables in the
    schema.
    """
    with db_testing.create_isolated_db(monkeypatch) as db_client:
        db_models.metadata.create_all(bind=db_client._engine)
        # Skipping the sync that normally occurs to do in tests below
        yield db_client


def validate_lookup_synced_to_table(
    db_session, table: Type[LookupTable], lookup_config: LookupConfig
):
    db_lookup_values = db_session.query(table).all()

    assert len(db_lookup_values) == len(lookup_config.get_lookups())

    primary_key = inspect(table).primary_key[0].name

    # Verify the values match by seeing if we can convert the descriptions
    for db_lookup_value in db_lookup_values:
        id_value = getattr(db_lookup_value, primary_key)
        lookup_value = lookup_config.get_lookup_for_int(id_value)

        assert lookup_value is not None
        assert db_lookup_value.description == lookup_value.get_description()


def test_sync_lookup_for_table_sanity(db_session):
    # Note that db_session calls in a fixture that
    # does the syncing, this test is making sure our tests
    # are working with the correct data.
    sync_values = LookupRegistry.get_sync_values()

    assert len(sync_values) > 0

    # Verify all of our values are in the DB
    for table, lookup in sync_values.items():
        validate_lookup_synced_to_table(db_session, table, lookup)


class NewOpportunityCategory(StrEnum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


NEW_OPPORTUNITY_CATEGORY_CONFIG = LookupConfig(
    [
        LookupStr(NewOpportunityCategory.A, 1),
        LookupStr(NewOpportunityCategory.B, 2),
        LookupStr(NewOpportunityCategory.C, 3),
        LookupStr(NewOpportunityCategory.D, 4),
        LookupStr(NewOpportunityCategory.E, 5),
        LookupStr(NewOpportunityCategory.F, 6),
        LookupStr(NewOpportunityCategory.G, 7),
    ]
)


def test_sync_lookup_for_table(schema_no_lookup, caplog: pytest.LogCaptureFixture):
    caplog.set_level(logging.INFO)
    with schema_no_lookup.get_session() as db_session:
        sync_values = LookupRegistry.get_sync_values()
        for table in sync_values.keys():
            assert db_session.query(table).count() == 0

    # Sync the lookup values to the DB
    sync_lookup_values(schema_no_lookup)

    with schema_no_lookup.get_session() as db_session:
        for table, lookup in sync_values.items():
            validate_lookup_synced_to_table(db_session, table, lookup)

    # Running sync again won't cause any change
    caplog.clear()
    sync_lookup_values(schema_no_lookup)
    assert "No modified lookup values for table lk_opportunity_category" in caplog.text

    # Modify the lookup values used for one of the lookups
    # in order to test that updates work, but reset it afterwards
    # to avoid breaking other tests.
    existing_suffix_config = LookupRegistry._lookup_registry[LkOpportunityCategory]
    try:
        LookupRegistry._lookup_registry[LkOpportunityCategory] = NEW_OPPORTUNITY_CATEGORY_CONFIG
        caplog.clear()
        sync_lookup_values(schema_no_lookup)
        assert "Updated lookup value in table lk_opportunity_category to" in caplog.text

        with schema_no_lookup.get_session() as db_session:
            validate_lookup_synced_to_table(
                db_session, LkOpportunityCategory, NEW_OPPORTUNITY_CATEGORY_CONFIG
            )

    finally:
        LookupRegistry._lookup_registry[LkOpportunityCategory] = existing_suffix_config
