import jwt
from datetime import datetime, timedelta, timezone

import pytest

from src.auth.login_gov_jwt_auth import validate_token, LoginGovConfig, LoginGovUser, JwtValidationError

# TODO - make our own RSA key
private_key = b"-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAwhvqCC+37A+UXgcvDl+7nbVjDI3QErdZBkI1VypVBMkKKWHM\nNLMdHk0bIKL+1aDYTRRsCKBy9ZmSSX1pwQlO/3+gRs/MWG27gdRNtf57uLk1+lQI\n6hBDozuyBR0YayQDIx6VsmpBn3Y8LS13p4pTBvirlsdX+jXrbOEaQphn0OdQo0WD\noOwwsPCNCKoIMbUOtUCowvjesFXlWkwG1zeMzlD1aDDS478PDZdckPjT96ICzqe4\nO1Ok6fRGnor2UTmuPy0f1tI0F7Ol5DHAD6pZbkhB70aTBuWDGLDR0iLenzyQecmD\n4aU19r1XC9AHsVbQzxHrP8FveZGlV/nJOBJwFwIDAQABAoIBAFCVFBA39yvJv/dV\nFiTqe1HahnckvFe4w/2EKO65xTfKWiyZzBOotBLrQbLH1/FJ5+H/82WVboQlMATQ\nSsH3olMRYbFj/NpNG8WnJGfEcQpb4Vu93UGGZP3z/1B+Jq/78E15Gf5KfFm91PeQ\nY5crJpLDU0CyGwTls4ms3aD98kNXuxhCGVbje5lCARizNKfm/+2qsnTYfKnAzN+n\nnm0WCjcHmvGYO8kGHWbFWMWvIlkoZ5YubSX2raNeg+YdMJUHz2ej1ocfW0A8/tmL\nwtFoBSuBe1Z2ykhX4t6mRHp0airhyc+MO0bIlW61vU/cPGPos16PoS7/V08S7ZED\nX64rkyECgYEA4iqeJZqny/PjOcYRuVOHBU9nEbsr2VJIf34/I9hta/mRq8hPxOdD\n/7ES/ZTZynTMnOdKht19Fi73Sf28NYE83y5WjGJV/JNj5uq2mLR7t2R0ZV8uK8tU\n4RR6b2bHBbhVLXZ9gqWtu9bWtsxWOkG1bs0iONgD3k5oZCXp+IWuklECgYEA27bA\n7UW+iBeB/2z4x1p/0wY+whBOtIUiZy6YCAOv/HtqppsUJM+W9GeaiMpPHlwDUWxr\n4xr6GbJSHrspkMtkX5bL9e7+9zBguqG5SiQVIzuues9Jio3ZHG1N2aNrr87+wMiB\nxX6Cyi0x1asmsmIBO7MdP/tSNB2ebr8qM6/6mecCgYBA82ZJfFm1+8uEuvo6E9/R\nyZTbBbq5BaVmX9Y4MB50hM6t26/050mi87J1err1Jofgg5fmlVMn/MLtz92uK/hU\nS9V1KYRyLc3h8gQQZLym1UWMG0KCNzmgDiZ/Oa/sV5y2mrG+xF/ZcwBkrNgSkO5O\n7MBoPLkXrcLTCARiZ9nTkQKBgQCsaBGnnkzOObQWnIny1L7s9j+UxHseCEJguR0v\nXMVh1+5uYc5CvGp1yj5nDGldJ1KrN+rIwMh0FYt+9dq99fwDTi8qAqoridi9Wl4t\nIXc8uH5HfBT3FivBtLucBjJgOIuK90ttj8JNp30tbynkXCcfk4NmS23L21oRCQyy\nlmqNDQKBgQDRvzEB26isJBr7/fwS0QbuIlgzEZ9T3ZkrGTFQNfUJZWcUllYI0ptv\ny7ShHOqyvjsC3LPrKGyEjeufaM5J8EFrqwtx6UB/tkGJ2bmd1YwOWFHvfHgHCZLP\n34ZNURCvxRV9ZojS1zmDRBJrSo7+/K0t28hXbiaTOjJA18XAyyWmGg==\n-----END RSA PRIVATE KEY-----\n"
public_key = b"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwhvqCC+37A+UXgcvDl+7\nnbVjDI3QErdZBkI1VypVBMkKKWHMNLMdHk0bIKL+1aDYTRRsCKBy9ZmSSX1pwQlO\n/3+gRs/MWG27gdRNtf57uLk1+lQI6hBDozuyBR0YayQDIx6VsmpBn3Y8LS13p4pT\nBvirlsdX+jXrbOEaQphn0OdQo0WDoOwwsPCNCKoIMbUOtUCowvjesFXlWkwG1zeM\nzlD1aDDS478PDZdckPjT96ICzqe4O1Ok6fRGnor2UTmuPy0f1tI0F7Ol5DHAD6pZ\nbkhB70aTBuWDGLDR0iLenzyQecmD4aU19r1XC9AHsVbQzxHrP8FveZGlV/nJOBJw\nFwIDAQAB\n-----END PUBLIC KEY-----\n"

DEFAULT_CLIENT_ID = "urn:gov:unit-test"
DEFAULT_ISSUER = "http://localhost:3000"

def create_jwt(
        user_id: str,
        email: str,
        expires_at: datetime,
        issued_at: datetime,
        not_before: datetime,
        issuer: str = DEFAULT_ISSUER,
        audience: str = DEFAULT_CLIENT_ID,
        acr: str = "urn:acr.login.gov:auth-only",
):
    payload = {
        "sub": user_id,
        "iss": issuer,
        "acr": acr,
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
    }

    return jwt.encode(payload, private_key, algorithm="RS256")

@pytest.fixture
def login_gov_config():
    return LoginGovConfig(
        LOGIN_GOV_PUBLIC_KEYS=[public_key],
        LOGIN_GOV_JWK_ENDPOINT="not_used",
        LOGIN_GOV_ENDPOINT=DEFAULT_ISSUER,
        LOGIN_GOV_CLIENT_ID=DEFAULT_CLIENT_ID
    )


def test_validate_token_happy_path(login_gov_config):
    user_id = "12345678-abc"
    email = "fake@mail.com"

    token = create_jwt(
        user_id=user_id,
        email=email,
        expires_at=datetime.now(tz=timezone.utc) + timedelta(days=30),
        issued_at=datetime.now(tz=timezone.utc) - timedelta(days=1),
        not_before=datetime.now(tz=timezone.utc) - timedelta(days=1),
    )

    login_gov_user = validate_token(token, login_gov_config)

    assert login_gov_user.user_id == user_id
    assert login_gov_user.email == email

def test_validate_token_expired(login_gov_config):
    token = create_jwt(
        user_id="abc123",
        email="mail@fake.com",
        expires_at=datetime.now(tz=timezone.utc) - timedelta(days=1),
        issued_at=datetime.now(tz=timezone.utc) - timedelta(days=30),
        not_before=datetime.now(tz=timezone.utc) - timedelta(days=30),
    )

    with pytest.raises(JwtValidationError, match="Expired Token"):
        validate_token(token, login_gov_config)

def test_validate_token_issued_at_future(login_gov_config):
    token = create_jwt(
        user_id="abc123",
        email="mail@fake.com",
        expires_at=datetime.now(tz=timezone.utc) + timedelta(days=1),
        issued_at=datetime.now(tz=timezone.utc) + timedelta(days=1),
        not_before=datetime.now(tz=timezone.utc) - timedelta(days=30),
    )

    with pytest.raises(JwtValidationError, match="Token not yet valid"):
        validate_token(token, login_gov_config)


def test_validate_token_not_before_future(login_gov_config):
    token = create_jwt(
        user_id="abc123",
        email="mail@fake.com",
        expires_at=datetime.now(tz=timezone.utc) + timedelta(days=30),
        issued_at=datetime.now(tz=timezone.utc) - timedelta(days=1),
        not_before=datetime.now(tz=timezone.utc) + timedelta(days=1),
    )

    with pytest.raises(JwtValidationError, match="Token not yet valid"):
        validate_token(token, login_gov_config)

def test_validate_token_unknown_issuer(login_gov_config):
    token = create_jwt(
        user_id="abc123",
        email="mail@fake.com",
        issuer="fred",
        expires_at=datetime.now(tz=timezone.utc) + timedelta(days=30),
        issued_at=datetime.now(tz=timezone.utc) - timedelta(days=1),
        not_before=datetime.now(tz=timezone.utc) - timedelta(days=1),
    )

    with pytest.raises(JwtValidationError, match="Unknown Issuer"):
        validate_token(token, login_gov_config)

def test_validate_token_unknown_audience(login_gov_config):
    token = create_jwt(
        user_id="abc123",
        email="mail@fake.com",
        audience="fred",
        expires_at=datetime.now(tz=timezone.utc) + timedelta(days=30),
        issued_at=datetime.now(tz=timezone.utc) - timedelta(days=1),
        not_before=datetime.now(tz=timezone.utc) - timedelta(days=1),
    )

    with pytest.raises(JwtValidationError, match="Unknown Audience"):
        validate_token(token, login_gov_config)