from calendar import timegm
from datetime import datetime

import jwt
import pytest
from freezegun import freeze_time

from grants_shared.auth.api_jwt_auth import ApiJwtConfig, JwtAuth
from tests.grants_shared.db.models.factories import SharedLinkExternalUserFactory, SharedUserFactory
from tests.grants_shared.db_test_models.db_test_models import SharedUserTokenSession
from tests.grants_shared.test_utils.auth_handler import AuthHandler


@pytest.fixture
def jwt_config(private_rsa_key, public_rsa_key):
    return ApiJwtConfig(
        API_JWT_PRIVATE_KEY=private_rsa_key,
        API_JWT_PUBLIC_KEY=public_rsa_key,
    )


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_create_jwt_for_user(enable_factory_create, db_session, jwt_config):
    user = SharedUserFactory.create()
    linked_external_user = SharedLinkExternalUserFactory.create(shared_user=user)
    token, token_session = JwtAuth(AuthHandler(db_session), jwt_config).create_jwt_for_user(
        user, None
    )
    decoded_token = jwt.decode(
        token, algorithms=[jwt_config.algorithm], options={"verify_signature": False}
    )

    # Verify the issued at timestamp is at the expected (now) timestamp
    # note we have to convert it to a unix timestamp
    assert decoded_token["iat"] == timegm(
        datetime.fromisoformat("2024-11-14 12:00:00+00:00").utctimetuple()
    )
    assert decoded_token["user_id"] == str(user.shared_user_id)
    assert decoded_token["email"] is None
    assert decoded_token["iss"] == jwt_config.issuer
    assert decoded_token["aud"] == jwt_config.audience

    token_with_email, token_session = JwtAuth(
        AuthHandler(db_session), jwt_config
    ).create_jwt_for_user(user, linked_external_user.email)
    decoded_token_with_email = jwt.decode(
        token_with_email, algorithms=[jwt_config.algorithm], options={"verify_signature": False}
    )
    assert decoded_token_with_email["email"] == linked_external_user.email

    # Verify that the sub_id returned can be used to fetch a UserTokenSession object
    token_session = (
        db_session.query(SharedUserTokenSession)
        .filter(SharedUserTokenSession.token_id == decoded_token["sub"])
        .one_or_none()
    )

    assert token_session.shared_user_id == user.shared_user_id
    assert token_session.is_valid is True
    # Verify expires_at is set to 30 minutes after now by default
    assert token_session.expires_at == datetime.fromisoformat("2024-11-14 12:30:00+00:00")

    # Basic testing that the JWT we create for a user can in turn be fetched and processed later
    user_session = JwtAuth(AuthHandler(db_session), jwt_config).parse_jwt_for_user(token)
    assert user_session.shared_user_id == user.shared_user_id


# TODO: Unit tests that need to be added:
# * JwtAuth.parse_jwt_for_user succeeds
# * JwtAuth.parse_jwt_for_user fails when token is not yet valid
# * JwtAuth.parse_jwt_for_user fails when token has unknown issuer
# * JwtAuth.parse_jwt_for_user fails when token has unknown audience
# * JwtAuth.parse_jwt_for_user fails when unable to process token
# * JwtAuth.parse_jwt_for_user fails when token is missing sub field
# * JwtAuth.parse_jwt_for_user fails when token session is none
# * JwtAuth.parse_jwt_for_user fails when token is expired
# * JwtAuth.parse_jwt_for_user fails when token is no longer valid
# * refresh_token_experience succeeds
# * refresh_token_experience handles a config of None
