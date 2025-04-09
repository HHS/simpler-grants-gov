from src.services.legacy_users.utils import get_legacy_user_for_login_gov_id
from tests.src.db.models.factories import (
    LoginGovStateFactory,
    StagingTuserAccountFactory,
    StagingTuserAccountMapperFactory,
)


def test_get_legacy_user_for_login_gov_id(db_session, enable_factory_create):
    # create test data
    login_gov = LoginGovStateFactory.create()
    user_acc = StagingTuserAccountFactory.create()
    StagingTuserAccountMapperFactory.create(
        user_account_id=user_acc.user_account_id, ext_user_id=str(login_gov.login_gov_state_id)
    )

    user = get_legacy_user_for_login_gov_id(str(login_gov.login_gov_state_id), db_session)

    assert user_acc == user
