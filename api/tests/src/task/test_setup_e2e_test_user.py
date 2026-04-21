import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.constants.static_role_values import E2E_TEST_USER_ROLE
from src.db.models.user_models import User
from src.task.setup_e2e_test_user import SetupE2eTestUserTask


def test_setup_e2e_test_user(enable_factory_create, db_session):
    api_key = "staging-e2e-test-key"

    task = SetupE2eTestUserTask(db_session, api_key)
    task.run()

    db_session.expire_all()
    user = db_session.execute(
        select(User)
        .options(
            selectinload(User.api_keys),
            selectinload(User.internal_user_roles),
        )
        .where(User.user_id == task.user_id)
    ).scalar_one()

    # Verify user was created
    assert user is not None

    # Verify API key
    assert len(user.api_keys) == 1
    assert user.api_keys[0].key_id == api_key
    assert user.api_keys[0].is_active is True

    # Verify internal role
    assert len(user.internal_user_roles) == 1
    assert user.internal_user_roles[0].role_id == E2E_TEST_USER_ROLE.role_id


def test_setup_e2e_test_user_is_idempotent(enable_factory_create, db_session):
    api_key = "staging-e2e-test-key"

    # Run twice
    SetupE2eTestUserTask(db_session, api_key).run()
    SetupE2eTestUserTask(db_session, api_key).run()

    db_session.expire_all()
    user = db_session.execute(
        select(User)
        .options(
            selectinload(User.api_keys),
            selectinload(User.internal_user_roles),
        )
        .where(User.user_id == SetupE2eTestUserTask(db_session, api_key).user_id)
    ).scalar_one()

    # Should still have exactly one API key and one role
    assert len(user.api_keys) == 1
    assert len(user.internal_user_roles) == 1


def test_does_not_work_in_prod(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    with pytest.raises(Exception, match="ENVIRONMENT must be local, dev, staging, or training"):
        SetupE2eTestUserTask(db_session, "some-key").run()
