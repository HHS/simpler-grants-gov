import pytest
from sqlalchemy import select

from src.constants.lookup_constants import GrantsMgmtUserType
from src.db.models.user_models import GrantsMgmtUser
from tests.db.models.factories import GrantsMgmtUserFactory


def test_user_factory_build():
    user = GrantsMgmtUserFactory.build()

    assert user.grants_mgmt_user_id is not None
    assert user.user_type == GrantsMgmtUserType.STANDARD

    # Verify we can override values in the factories
    user = GrantsMgmtUserFactory.build(user_type=GrantsMgmtUserType.INTERNAL_FRONTEND)
    assert user.grants_mgmt_user_id is not None
    assert user.user_type == GrantsMgmtUserType.INTERNAL_FRONTEND


def test_user_factory_create(enable_factory_create, db_session):

    user = GrantsMgmtUserFactory.create()

    assert user.grants_mgmt_user_id is not None
    assert user.user_type == GrantsMgmtUserType.STANDARD

    db_record = db_session.execute(select(GrantsMgmtUser).where(GrantsMgmtUser.grants_mgmt_user_id == user.grants_mgmt_user_id)).scalar()
    assert db_record.grants_mgmt_user_id == user.grants_mgmt_user_id
    assert db_record.user_type == user.user_type

    # Verify we can override values in the factories
    user = GrantsMgmtUserFactory.create(user_type=GrantsMgmtUserType.INTERNAL_FRONTEND)
    assert user.grants_mgmt_user_id is not None
    assert user.user_type == GrantsMgmtUserType.INTERNAL_FRONTEND

    db_record = db_session.execute(select(GrantsMgmtUser).where(GrantsMgmtUser.grants_mgmt_user_id == user.grants_mgmt_user_id)).scalar()
    assert db_record.grants_mgmt_user_id == user.grants_mgmt_user_id
    assert db_record.user_type == user.user_type


def test_factory_create_uninitialized_db_session():
    # DB factory access is disabled from tests unless you add the
    # 'enable_factory_create' fixture.
    with pytest.raises(Exception, match="Factory db_session is not initialized."):
        GrantsMgmtUserFactory.create()
