import pytest

from grants_shared.auth.api_jwt_auth import ApiJwtConfig, JwtAuth
from tests.grants_shared.db.models.factories import SharedLoginGovStateFactory
from tests.grants_shared.test_utils.auth_handler import AuthHandler
from tests.grants_shared.test_utils.login_gov_callback_handler import LoginGovCallbackHandler


def get_auth_handler(db_session):
    return AuthHandler(db_session)


def create_jwt_for_user(user, db_session, config, email=None):
    return JwtAuth(get_auth_handler(db_session), config).create_jwt_for_user(user, email)


def parse_jwt_for_user(token, db_session, config):
    return JwtAuth(get_auth_handler(db_session), config).parse_jwt_for_user(token)


@pytest.fixture
def jwt_config(private_rsa_key, public_rsa_key):
    return ApiJwtConfig(
        API_JWT_PRIVATE_KEY=private_rsa_key,
        API_JWT_PUBLIC_KEY=public_rsa_key,
    )


def test_login_callback_handler_handle_callback_request(
    enable_factory_create, db_session, jwt_config
):
    auth_handler = AuthHandler(db_session)
    jwt_auth = JwtAuth(auth_handler, jwt_config)
    login_gov_callback_handler = LoginGovCallbackHandler(auth_handler, jwt_auth)
    login_gov_state = SharedLoginGovStateFactory.create()
    query = {
        "code": "1234",
        "state": str(login_gov_state.shared_login_gov_state_id),
    }
    login_gov_data_container = login_gov_callback_handler.handle_callback_request(query)
    assert login_gov_data_container.code == query["code"]
    assert login_gov_data_container.nonce == str(login_gov_state.nonce)


# TODO: Unit tests that need to be added:
# * login_callback_handler.handle_callback_request fails due to invalid callback params
# * login_callback_handler.handle_callback_request fails due to code being none
# * login_callback_handler.handle_callback_request fails due to state being none
# * login_callback_handler.handle_callback_request fails due to invalid uuid for state
# * login_callback_handler.handle_callback_request fails due to login gov state being none
# * login_callback_handler.handle_token succeeds
# * login_callback_handler.handle_token when oauth token reponse is error
# * login_callback_handler.handle_token when login.gov validation fails
