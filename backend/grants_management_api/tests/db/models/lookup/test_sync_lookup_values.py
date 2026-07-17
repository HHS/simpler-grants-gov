import logging
import uuid

import grants_shared.adapters.db as db
import pytest

import src.db.models as db_models
from src.constants.lookup_constants import MgmtPrivilege
from src.constants.static_role_values import CORE_ROLES, TEAM_VIEWER
from src.db.models.lookup.sync_lookup_values import sync_lookup_values
from src.db.models.resource_models import MgmtRole
from tests.test_utils import db_testing


@pytest.fixture
def schema_no_lookup(monkeypatch) -> db.PostgresDBClient:
    """
    Create an isolated test schema with all tables created but no lookup values
    or roles synced, so the sync behavior can be tested from a clean slate.
    """
    with db_testing.create_isolated_db(
        monkeypatch, f"test_lookup_{uuid.uuid4().int}_"
    ) as db_client:
        with db_client.get_connection() as conn, conn.begin():
            db_models.metadata.create_all(bind=conn)
        yield db_client


def _records_for_message(caplog: pytest.LogCaptureFixture, message: str) -> list[logging.LogRecord]:
    return [record for record in caplog.records if record.message == message]


def test_sync_roles(schema_no_lookup, caplog: pytest.LogCaptureFixture):
    caplog.set_level(logging.INFO)

    with schema_no_lookup.get_session() as db_session:
        assert db_session.query(MgmtRole).count() == 0

    # First sync inserts all core roles.
    sync_lookup_values(schema_no_lookup)

    with schema_no_lookup.get_session() as db_session:
        db_roles = db_session.query(MgmtRole).all()
        assert len(db_roles) == len(CORE_ROLES)

        team_viewer = db_session.get(MgmtRole, TEAM_VIEWER.mgmt_role_id)
        assert team_viewer is not None
        assert team_viewer.role_name == "Team Viewer"
        assert team_viewer.is_core is True
        assert set(team_viewer.privileges) == {MgmtPrivilege.VIEW_TEAM}

    # Running the sync again should not modify any role.
    caplog.clear()
    sync_lookup_values(schema_no_lookup)

    assert len(_records_for_message(caplog, "No modified values for static core role")) == len(
        CORE_ROLES
    )
    assert len(_records_for_message(caplog, "Updated static core role")) == 0


def test_sync_roles_applies_updates(schema_no_lookup, caplog: pytest.LogCaptureFixture):
    caplog.set_level(logging.INFO)
    sync_lookup_values(schema_no_lookup)

    original_privileges = set(TEAM_VIEWER.privileges)
    try:
        # Change a static role and confirm the update is detected and persisted.
        TEAM_VIEWER.privileges = {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM}

        caplog.clear()
        sync_lookup_values(schema_no_lookup)

        updated_records = _records_for_message(caplog, "Updated static core role")
        assert [record.role_name for record in updated_records] == ["Team Viewer"]

        with schema_no_lookup.get_session() as db_session:
            team_viewer = db_session.get(MgmtRole, TEAM_VIEWER.mgmt_role_id)
            assert set(team_viewer.privileges) == {
                MgmtPrivilege.VIEW_TEAM,
                MgmtPrivilege.UPDATE_TEAM,
            }
    finally:
        # Restore the shared static role so other tests aren't affected.
        TEAM_VIEWER.privileges = original_privileges
