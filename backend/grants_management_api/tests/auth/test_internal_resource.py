import uuid

import pytest
from sqlalchemy import select

from src.auth.internal_resource import (
    INTERNAL_RESOURCE_NAME,
    create_internal_resource,
    get_internal_resource,
)
from src.constants.lookup_constants import MgmtResourceType
from src.db.models.resource_models import MgmtInternalResource, MgmtResource


@pytest.fixture
def internal_resource_id(monkeypatch):
    """Use a distinct configured internal resource ID per test so tests never collide."""
    internal_resource_id = uuid.uuid4()
    monkeypatch.setenv("MGMT_INTERNAL_RESOURCE_ID", str(internal_resource_id))
    return internal_resource_id


def test_create_internal_resource(db_session, internal_resource_id):
    internal_resource = create_internal_resource(db_session)
    # Flush so the resource automation (before_flush) populates the backing resource row
    db_session.flush()

    assert internal_resource.mgmt_internal_resource_id == internal_resource_id
    assert internal_resource.internal_resource_name == INTERNAL_RESOURCE_NAME

    # The backing resource row is created via resource automation
    assert internal_resource.resource.mgmt_resource_id == internal_resource_id
    assert internal_resource.resource.mgmt_resource_type == MgmtResourceType.INTERNAL

    # Only a single record exists in the DB for the configured ID
    records = (
        db_session.execute(
            select(MgmtInternalResource).where(
                MgmtInternalResource.mgmt_internal_resource_id == internal_resource_id
            )
        )
        .scalars()
        .all()
    )
    assert len(records) == 1


def test_create_internal_resource_is_idempotent(db_session, internal_resource_id):
    first = create_internal_resource(db_session)
    second = create_internal_resource(db_session)

    assert (
        first.mgmt_internal_resource_id == second.mgmt_internal_resource_id == internal_resource_id
    )

    # Still exactly one internal resource and one backing resource row for the configured ID
    internal_records = (
        db_session.execute(
            select(MgmtInternalResource).where(
                MgmtInternalResource.mgmt_internal_resource_id == internal_resource_id
            )
        )
        .scalars()
        .all()
    )
    assert len(internal_records) == 1

    resource_records = (
        db_session.execute(
            select(MgmtResource).where(MgmtResource.mgmt_resource_id == internal_resource_id)
        )
        .scalars()
        .all()
    )
    assert len(resource_records) == 1


def test_get_internal_resource(db_session, internal_resource_id):
    created = create_internal_resource(db_session)

    fetched = get_internal_resource(db_session)

    assert fetched.mgmt_internal_resource_id == created.mgmt_internal_resource_id
    assert fetched.get_resource_id() == internal_resource_id
    assert fetched.get_resource_type() == MgmtResourceType.INTERNAL


def test_get_internal_resource_raises_when_missing(db_session, internal_resource_id):
    with pytest.raises(ValueError, match="does not exist"):
        get_internal_resource(db_session)
