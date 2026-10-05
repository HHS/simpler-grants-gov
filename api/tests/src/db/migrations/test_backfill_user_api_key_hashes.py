"""Tests for the user_api_key.key_id_hash backfill run by the
backfill_key_id_hash_and_finalize migration.
"""

import pytest
from sqlalchemy import text

from src.auth.api_key_config import ApiKeyConfig
from src.auth.auth_handler import AuthHandler
from src.db.migrations.utils import backfill_user_api_key_hashes
from src.util.api_key_gen import hash_api_key_id
from tests.src.db.models.factories import UserApiKeyFactory


@pytest.fixture
def nullable_key_id_hash(db_session, test_api_schema):
    """Allow key_id_hash to be NULL so rows can be set up as they were before the backfill.

    Test schemas are built from SQLAlchemy metadata, where key_id_hash is NOT NULL.
    Drop the constraint for the test and restore it afterwards so the session-scoped
    schema is left as the other tests expect it.
    """
    table = f"{test_api_schema}.user_api_key"

    db_session.execute(text(f"ALTER TABLE {table} ALTER COLUMN key_id_hash DROP NOT NULL"))
    db_session.commit()

    yield

    # Only leftover if a test failed before the backfill ran
    db_session.execute(text(f"DELETE FROM {table} WHERE key_id_hash IS NULL"))
    db_session.execute(text(f"ALTER TABLE {table} ALTER COLUMN key_id_hash SET NOT NULL"))
    db_session.commit()


def test_backfill_user_api_key_hashes(db_session, enable_factory_create, nullable_key_id_hash):
    pepper = ApiKeyConfig().pepper
    unhashed_keys = UserApiKeyFactory.create_batch(3, key_id_hash=None)
    # A row written by the dual-write on create, which the backfill should not touch
    already_hashed_key = UserApiKeyFactory.create(key_id_hash="already-hashed")

    backfill_user_api_key_hashes(db_session.connection(), pepper)
    db_session.commit()
    db_session.expire_all()

    auth_handler = AuthHandler(db_session)
    for key in unhashed_keys:
        assert key.key_id_hash == hash_api_key_id(key.key_id, pepper)
        # The lookup auth will use once it reads by hash resolves the backfilled row
        found_key = auth_handler.get_api_key_by_key_id_hash(hash_api_key_id(key.key_id, pepper))
        assert found_key is not None
        assert found_key.api_key_id == key.api_key_id

    assert already_hashed_key.key_id_hash == "already-hashed"


def test_backfill_user_api_key_hashes_nothing_to_backfill(
    db_session, enable_factory_create, nullable_key_id_hash
):
    key = UserApiKeyFactory.create()
    original_hash = key.key_id_hash

    backfill_user_api_key_hashes(db_session.connection(), ApiKeyConfig().pepper)
    db_session.commit()
    db_session.expire_all()

    assert key.key_id_hash == original_hash
