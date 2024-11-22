import jwt
from datetime import datetime, timedelta
import uuid
from src.auth.api_jwt_auth import parse_jwt_for_user
from src.util import datetime_util
from tests.src.db.models.factories import UserTokenSessionFactory, LinkExternalUserFactory


##################
# POST /token
##################



def create_jwt(
    user_id: str,
    private_key: str | bytes,
    email: str = "fake_mail@mail.com",
    expires_at: datetime | None = None,
    issued_at: datetime | None = None,
    not_before: datetime | None = None,
    # Note that these values need to match what we set
    # in conftest.py::setup_login_gov_auth
    issuer: str = "http://localhost:3000",
    audience: str = "AUDIENCE_TEST",
):
    """Create a JWT in roughly the format login.gov will give us"""

    # Default datetime values are set to clearly not be an issue
    if expires_at is None:
        expires_at = datetime.now() + timedelta(days=365)
    if issued_at is None:
        issued_at = datetime.now() - timedelta(days=365)
    if not_before is None:
        not_before = datetime.now() - timedelta(days=365)

    payload = {
        "sub": user_id,
        "iss": issuer,
        "aud": audience,
        "email": email,
        # The jwt encode function automatically turns these datetime
        # objects into a UTC timestamp integer
        "exp": expires_at,
        "iat": issued_at,
        "nbf": not_before,
        # These values aren't checked by anything at the moment
        # but are a part of the token from login.gov
        "jti": "abc123",
        "nonce": "abc123",
        "at_hash": "abc123",
        "c_hash": "abc123",
        "acr": "urn:acr.login.gov:auth-only",
    }

    return jwt.encode(payload, private_key, algorithm="RS256")

def test_post_user_token_200_new_user(client, db_session, api_auth_token, private_rsa_key):
    token = create_jwt(user_id=str(uuid.uuid4()), email="my_test_mail@test.com", private_key=private_rsa_key)

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    assert response_data["is_user_new"] is True
    assert response_data["user"]["email"] == "my_test_mail@test.com"
    assert response_data["user"]["external_user_type"] == "login_gov"

    user_id = response_data["user"]["user_id"]
    token = response_data["token"]

    # Verify the token we generated works with our later parsing logic
    user_token_session = parse_jwt_for_user(token, db_session)

    # Verify the session is connected to the user returned and the
    # expires_at is somewhere in the future / still valid
    assert str(user_token_session.user_id) == user_id
    assert user_token_session.expires_at > datetime_util.utcnow()
    assert user_token_session.is_valid is True

def test_post_user_token_200_existing_user_no_change(client, db_session, enable_factory_create, api_auth_token, private_rsa_key):
    login_gov_id = str(uuid.uuid4())
    external_user = LinkExternalUserFactory.create(external_user_id=login_gov_id)
    token = create_jwt(user_id=login_gov_id, email=external_user.email, private_key=private_rsa_key)

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    assert response_data["is_user_new"] is False
    assert response_data["user"]["email"] == external_user.email
    assert response_data["user"]["external_user_type"] == "login_gov"

    user_id = response_data["user"]["user_id"]
    token = response_data["token"]

    # Verify the token we generated works with our later parsing logic
    user_token_session = parse_jwt_for_user(token, db_session)

    # Verify the session is connected to the user returned and the
    # expires_at is somewhere in the future / still valid
    assert str(user_token_session.user_id) == user_id
    assert user_token_session.expires_at > datetime_util.utcnow()
    assert user_token_session.is_valid is True

def test_post_user_token_200_existing_user_new_email(client, db_session, enable_factory_create, api_auth_token, private_rsa_key):
    login_gov_id = str(uuid.uuid4())
    external_user = LinkExternalUserFactory.create(external_user_id=login_gov_id, email="some_old_email@mail.com")
    token = create_jwt(user_id=login_gov_id, email="a_new_exciting_email@mail.com", private_key=private_rsa_key)

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    assert response_data["is_user_new"] is False
    assert response_data["user"]["email"] == "a_new_exciting_email@mail.com"
    assert response_data["user"]["external_user_type"] == "login_gov"

    user_id = response_data["user"]["user_id"]
    token = response_data["token"]

    # Verify the token we generated works with our later parsing logic
    user_token_session = parse_jwt_for_user(token, db_session)

    # Verify the session is connected to the user returned and the
    # expires_at is somewhere in the future / still valid
    assert str(user_token_session.user_id) == user_id
    assert user_token_session.expires_at > datetime_util.utcnow()
    assert user_token_session.is_valid is True


def test_post_user_token_401_bad_token(client, db_session, api_auth_token):
    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": "something-that-is-not-a-jwt"}
    )
    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unable to process token"

def test_post_user_token_401_invalid_issuer(client, db_session, api_auth_token, private_rsa_key):
    token = create_jwt(user_id=str(uuid.uuid4()), private_key=private_rsa_key, issuer="not-the-right-issuer")

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unknown Issuer"

def test_post_user_token_401_invalid_audience(client, db_session, api_auth_token, private_rsa_key):
    token = create_jwt(user_id=str(uuid.uuid4()), private_key=private_rsa_key, audience="jeff")

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unknown Audience"

def test_post_user_token_401_expired_token(client, db_session, api_auth_token, private_rsa_key):
    token = create_jwt(user_id=str(uuid.uuid4()), private_key=private_rsa_key, expires_at=datetime_util.utcnow() - timedelta(minutes=10))

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Expired Token"

def test_post_user_token_401_issued_future(client, db_session, api_auth_token, private_rsa_key):
    token = create_jwt(user_id=str(uuid.uuid4()), private_key=private_rsa_key, issued_at=datetime_util.utcnow() + timedelta(minutes=10))

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token not yet valid"

def test_post_user_token_401_not_before_future(client, db_session, api_auth_token, private_rsa_key):
    token = create_jwt(user_id=str(uuid.uuid4()), private_key=private_rsa_key, not_before=datetime_util.utcnow() + timedelta(minutes=10))

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token not yet valid"

def test_post_user_token_401_no_valid_key(client, db_session, api_auth_token, other_rsa_key_pair):
    # Generate the token with a different key so the public key validation fails
    token = create_jwt(user_id=str(uuid.uuid4()), private_key=other_rsa_key_pair[0])

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": token}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token could not be validated against any public keys from login.gov"

def test_post_user_token_422_no_token(client, db_session, api_auth_token, private_rsa_key):
    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token}
    )

    assert resp.status_code == 422
    assert resp.get_json()["message"] == "Validation error"
    assert resp.get_json()["errors"] == [
        {"field": "X-OAuth-login-gov", "message": "Missing data for required field.", "type": "required"}
    ]

def test_post_user_route_token_401_invalid_api_auth_token(client, api_auth_token, private_rsa_key):
    token = create_jwt(user_id=str(uuid.uuid4()), email="my_test_mail@test.com", private_key=private_rsa_key)

    resp = client.post(
        "/v1/users/token", headers={"X-Auth": "invalid-auth", "X-OAuth-login-gov": token}
    )
    assert resp.status_code == 401
    assert resp.get_json()["message"] == "The server could not verify that you are authorized to access the URL requested"
