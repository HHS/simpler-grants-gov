from calendar import timegm
from datetime import datetime

import jwt
import pytest
from freezegun import freeze_time

from src.auth.api_jwt_auth import ApiJwtConfig, create_jwt_for_user, parse_jwt_for_user
from src.db.models.user_models import UserTokenSession
from tests.src.db.models.factories import UserFactory


@pytest.fixture
def jwt_config(private_rsa_key, public_rsa_key):
    return ApiJwtConfig(
        API_JWT_PRIVATE_KEY=private_rsa_key,
        API_JWT_PUBLIC_KEY=public_rsa_key,
    )


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_create_jwt_for_user(enable_factory_create, db_session, jwt_config):
    user = UserFactory.create()

    token = create_jwt_for_user(user, db_session, jwt_config)

    decoded_token = jwt.decode(
        token, algorithms=[jwt_config.algorithm], options={"verify_signature": False}
    )

    # Verify the issued at timestamp is at the expected (now) timestamp
    # note we have to convert it to a unix timestamp
    assert decoded_token["iat"] == timegm(
        datetime.fromisoformat("2024-11-14 12:00:00+00:00").utctimetuple()
    )
    assert decoded_token["iss"] == jwt_config.issuer
    assert decoded_token["aud"] == jwt_config.audience

    # Verify that the sub_id returned can be used to fetch a UserTokenSession object
    token_session = (
        db_session.query(UserTokenSession)
        .filter(UserTokenSession.token_id == decoded_token["sub"])
        .one_or_none()
    )

    assert token_session.user_id == user.user_id
    assert token_session.is_valid is True
    # Verify expires_at is set to 30 minutes after now by default
    assert token_session.expires_at == datetime.fromisoformat("2024-11-14 12:30:00+00:00")

    # Basic testing that the JWT we create for a user can in turn be fetched and processed later
    # TODO - more in https://github.com/HHS/simpler-grants-gov/issues/2809
    parsed_user = parse_jwt_for_user(token, db_session, jwt_config)
    assert parsed_user.user_id == user.user_id
