import pytest
from sqlalchemy import select

from src.constants.lookup_constants import UserType
from src.db.models.user_models import User
from tests.db.models.factories import UserFactory


def test_user_factory_build():
    user = UserFactory.build()

    assert user.user_id is not None
    assert user.user_type == UserType.STANDARD

    # Verify we can override values in the factories
    user = UserFactory.build(user_type=UserType.INTERNAL_FRONTEND)
    assert user.user_id is not None
    assert user.user_type == UserType.INTERNAL_FRONTEND


def test_user_factory_create(enable_factory_create, db_session):

    user = UserFactory.create()

    assert user.user_id is not None
    assert user.user_type == UserType.STANDARD

    db_record = db_session.execute(select(User).where(User.user_id == user.user_id)).scalar()
    assert db_record.user_id == user.user_id
    assert db_record.user_type == user.user_type

    # Verify we can override values in the factories
    user = UserFactory.create(user_type=UserType.INTERNAL_FRONTEND)
    assert user.user_id is not None
    assert user.user_type == UserType.INTERNAL_FRONTEND

    db_record = db_session.execute(select(User).where(User.user_id == user.user_id)).scalar()
    assert db_record.user_id == user.user_id
    assert db_record.user_type == user.user_type


def test_factory_create_uninitialized_db_session():
    # DB factory access is disabled from tests unless you add the
    # 'enable_factory_create' fixture.
    with pytest.raises(Exception, match="Factory db_session is not initialized."):
        UserFactory.create()
