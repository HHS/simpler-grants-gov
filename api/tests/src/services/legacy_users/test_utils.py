import pytest

from src.db.models.staging.user import TuserAccount, TuserAccountMapper
from src.db.models.user_models import LoginGovState
from src.services.legacy_users.utils import get_legacy_user_for_login_gov_id
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    LoginGovStateFactory,
    StagingTuserAccountFactory,
    StagingTuserAccountMapperFactory,
)


@pytest.fixture(autouse=True)
def clear_data(db_session):
    cascade_delete_from_db_table(db_session, LoginGovState)
    cascade_delete_from_db_table(db_session, TuserAccount)
    cascade_delete_from_db_table(db_session, TuserAccountMapper)


def test_get_legacy_user_for_login_gov_id(db_session, enable_factory_create):
    # create test data
    login_gov = LoginGovStateFactory.create()
    user_acc = StagingTuserAccountFactory.create()
    StagingTuserAccountMapperFactory.create(
        user_account_id=user_acc.user_account_id, ext_user_id=str(login_gov.login_gov_state_id)
    )

    user = get_legacy_user_for_login_gov_id(str(login_gov.login_gov_state_id), db_session)

    assert user_acc == user


def test_get_legacy_user_for_login_gov_id_not_found(db_session, enable_factory_create):
    login_gov = LoginGovStateFactory.create()
    user = get_legacy_user_for_login_gov_id(str(login_gov.login_gov_state_id), db_session)

    assert not user
