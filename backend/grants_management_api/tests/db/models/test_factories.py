import pytest
from sqlalchemy import select

from src.constants.lookup_constants import MgmtUserType
from src.db.models.user_models import MgmtUser
from tests.db.models.factories import MgmtUserFactory


def test_user_factory_build():
    user = MgmtUserFactory.build()

    assert user.mgmt_user_id is not None
    assert user.user_type == MgmtUserType.STANDARD

    # Verify we can override values in the factories
    user = MgmtUserFactory.build(user_type=MgmtUserType.INTERNAL_FRONTEND)
    assert user.mgmt_user_id is not None
    assert user.user_type == MgmtUserType.INTERNAL_FRONTEND


def test_user_factory_create(enable_factory_create, db_session):

    user = MgmtUserFactory.create()

    assert user.mgmt_user_id is not None
    assert user.user_type == MgmtUserType.STANDARD

    db_record = db_session.execute(
        select(MgmtUser).where(MgmtUser.mgmt_user_id == user.mgmt_user_id)
    ).scalar()
    assert db_record.mgmt_user_id == user.mgmt_user_id
    assert db_record.user_type == user.user_type

    # Verify we can override values in the factories
    user = MgmtUserFactory.create(user_type=MgmtUserType.INTERNAL_FRONTEND)
    assert user.mgmt_user_id is not None
    assert user.user_type == MgmtUserType.INTERNAL_FRONTEND

    db_record = db_session.execute(
        select(MgmtUser).where(MgmtUser.mgmt_user_id == user.mgmt_user_id)
    ).scalar()
    assert db_record.mgmt_user_id == user.mgmt_user_id
    assert db_record.user_type == user.user_type


def test_factory_create_uninitialized_db_session():
    # DB factory access is disabled from tests unless you add the
    # 'enable_factory_create' fixture.
    with pytest.raises(Exception, match="Factory db_session is not initialized."):
        MgmtUserFactory.create()
