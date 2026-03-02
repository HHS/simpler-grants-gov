import dataclasses
import logging
import urllib
import uuid
from datetime import timedelta

import flask
import jwt
from pydantic import Field

from src.adapters import db
from src.auth.auth_errors import JwtValidationError
from src.db.models.user_models import LoginGovState
from src.util import datetime_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class LoginGovConfig(PydanticBaseEnvConfig):
    """
    Configuration for login.gov JWT auth

    Do not create this directly, instead call get_login_gov_config
    which will handle setting it up for you.
    """

    # Public keys likely won't ever be set by an env var, so it defaults
    # to an empty dict and gets overriden by any call to _refresh_keys
    public_key_map: dict[str, jwt.PyJWK | str] = Field(
        alias="LOGIN_GOV_PUBLIC_KEY_MAP", default_factory=dict
    )

    encryption_algorithm: str = Field(alias="LOGIN_GOV_ENCRYPTION_ALGORITHM", default="RS256")

    client_id: str = Field(alias="LOGIN_GOV_CLIENT_ID")
    acr_value: str = Field(alias="LOGIN_GOV_ACR_VALUE", default="urn:acr.login.gov:auth-only")
    scope: str = Field(alias="LOGIN_GOV_SCOPE", default="openid email x509:presented")
    is_piv_required: bool = Field(alias="IS_PIV_REQUIRED", default=False)

    # While all of these endpoints are under the same root, we define the full
    # path each time because the local mock uses a different naming convention
    login_gov_endpoint: str = Field(alias="LOGIN_GOV_ENDPOINT")
    login_gov_jwk_endpoint: str = Field(alias="LOGIN_GOV_JWK_ENDPOINT")
    login_gov_auth_endpoint: str = Field(alias="LOGIN_GOV_AUTH_ENDPOINT")
    login_gov_token_endpoint: str = Field(alias="LOGIN_GOV_TOKEN_ENDPOINT")

    # Where we send a user after they have successfully logged in
    # for now we'll always send them to the same place (a frontend page)
    login_final_destination: str = Field(alias="LOGIN_FINAL_DESTINATION")

    # The private key we gave login.gov for private_key_jwt validation in the token endpoint
    # See: https://developers.login.gov/oidc/token/#client_assertion
    login_gov_client_assertion_private_key: str = Field(
        alias="LOGIN_GOV_CLIENT_ASSERTION_PRIVATE_KEY"
    )

    login_gov_redirect_scheme: str = Field(alias="LOGIN_GOV_REDIRECT_SCHEME", default="http")


# Initialize a config at startup
_config: LoginGovConfig | None = None


def initialize_login_gov_config() -> None:
    global _config
    if not _config:
        _config = LoginGovConfig()

        logger.info(
            "Constructed login.gov configuration",
            extra={
                "login_gov_endpoint": _config.login_gov_endpoint,
                "login_gov_jwk_endpoint": _config.login_gov_jwk_endpoint,
                "login_gov_auth_endpoint": _config.login_gov_auth_endpoint,
            },
        )


def get_config() -> LoginGovConfig:
    global _config

    if _config is None:
        raise Exception(
            "No Login.gov configuration - initialize_login_gov_config() must be run first"
        )

    return _config


@dataclasses.dataclass
class LoginGovUser:
    user_id: str
    email: str
    x509_presented: bool | None = None


def _refresh_keys(config: LoginGovConfig) -> None:
    """
    WARNING:
        This implementation is technically incorrect as it does
        not account for thread safety. If multiple threads attempt to
        refresh the token at the same time, they will all set it separately.

        Assignment in python should be atomic, and the Python global-interpreter-lock
        likely make this less risky, but there is no guarantee that this won't
        cause issues as we use it.

        We will evaluate this behavior over time and see if it causes us any issues.
        For now, we are fine accepting this risk as the complexity of caching this
        in a thread-safe way (eg. database, redis, or using Python locks)
        isn't seen as worthwhile at the moment.
    """
    logger.info("Refreshing login.gov JWKs")
    jwk_client = jwt.PyJWKClient(config.login_gov_jwk_endpoint)
    public_keys = jwk_client.get_jwk_set()

    public_key_map: dict[str, jwt.PyJWK | str] = {
        key.key_id: key for key in public_keys.keys if key.key_id is not None
    }

    if public_key_map.keys() != config.public_key_map.keys():
        logger.info("Found login.gov JWKs %s", public_key_map.keys())

    # This line is possibly an issue for the reasons described above.
    config.public_key_map = public_key_map


def get_login_gov_redirect_uri(db_session: db.Session, config: LoginGovConfig | None = None) -> str:
    if config is None:
        config = get_config()

    nonce = uuid.uuid4()
    state = uuid.uuid4()

    # Ask Flask for its own URI - specifying we want the callback route
    # .user_login_callback points to the function itself defined in user_routes.py
    redirect_uri = flask.url_for(
        ".user_login_callback", _external=True, _scheme=config.login_gov_redirect_scheme
    )

    # We want to redirect to the authorization endpoint of login.gov
    # See: https://developers.login.gov/oidc/authorization/
    encoded_params = urllib.parse.urlencode(
        {
            "client_id": config.client_id,
            "nonce": nonce,
            "state": state,
            "redirect_uri": redirect_uri,
            "acr_values": config.acr_value,
            "scope": config.scope,
            # These are statically defined by the spec
            "prompt": "select_account",
            "response_type": "code",
        }
    )

    # Add the state to the DB
    db_session.add(LoginGovState(login_gov_state_id=state, nonce=nonce))

    return f"{config.login_gov_auth_endpoint}?{encoded_params}"


def get_login_gov_client_assertion(config: LoginGovConfig | None = None) -> str:
    """Generate a client assertion token for login.gov auth"""
    if config is None:
        config = get_config()

    # Docs recommend a 5 minute expiration time
    current_time = datetime_util.utcnow()
    expiration_time = current_time + timedelta(minutes=5)

    # See: https://developers.login.gov/oidc/token/#client_assertion
    client_assertion_payload = {
        "iss": config.client_id,
        "sub": config.client_id,
        "aud": config.login_gov_token_endpoint,
        "jti": str(uuid.uuid4()),
        "exp": expiration_time,
    }

    return jwt.encode(
        client_assertion_payload, config.login_gov_client_assertion_private_key, algorithm="RS256"
    )


def get_final_redirect_uri(
    message: str,
    token: str | None = None,
    is_user_new: bool | None = None,
    error_description: str | None = None,
    config: LoginGovConfig | None = None,
) -> str:
    if config is None:
        config = get_config()

    params: dict = {"message": message}

    if token is not None:
        params["token"] = token

    if is_user_new is not None:
        params["is_user_new"] = int(is_user_new)  # put booleans in the URL as 0/1

    if error_description is not None:
        params["error_description"] = error_description

    encoded_params = urllib.parse.urlencode(params)

    return f"{config.login_final_destination}?{encoded_params}"


def validate_token(token: str, nonce: str, config: LoginGovConfig | None = None) -> LoginGovUser:
    if not config:
        config = get_config()

    try:
        # To get the KID, we need parse the jwt
        unverified_token = jwt.api_jwt.decode_complete(token, options={"verify_signature": False})
    except jwt.DecodeError as e:
        # This would mean the token was malformed - likely not a jwt at all
        raise JwtValidationError("Unable to parse token - invalid format") from e

    # Get the KID (key ID)
    kid: str | None = unverified_token.get("header", {}).get("kid", None)
    if kid is None:
        raise JwtValidationError("Auth token missing KID")

    public_key = _get_key_for_kid(kid, config)

    return _validate_token_with_key(token, nonce, public_key, config)


def _get_key_for_kid(kid: str, config: LoginGovConfig, refresh: bool = True) -> jwt.PyJWK | str:
    """Get the public key for the given KID (Key ID)"""
    key = config.public_key_map.get(kid, None)
    if key is not None:
        return key

    # Fetch the latest keys from login.gov and try again
    if refresh:
        _refresh_keys(config)
        return _get_key_for_kid(kid, config, refresh=False)

    raise JwtValidationError("No public key could be found for token")


def _validate_token_with_key(
    token: str, nonce: str, public_key: jwt.PyJWK | str, config: LoginGovConfig
) -> LoginGovUser:
    # We are processing the id_token as described on:
    # https://developers.login.gov/oidc/token/#token-response
    try:
        data = jwt.api_jwt.decode_complete(
            token,
            public_key,
            algorithms=[config.encryption_algorithm],
            issuer=config.login_gov_endpoint,
            audience=config.client_id,
            # By default these options are already set to validate
            # but making it very clear / explicit the validations we are doing
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "verify_nbf": True,
                "verify_aud": True,
                "verify_iss": True,
            },
        )
        payload = data.get("payload", {})

        payload_nonce = payload.get("nonce", None)
        if payload_nonce != nonce:
            raise JwtValidationError("Nonce does not match expected")

        user_id = payload["sub"]
        email = payload["email"]
        x509_presented = payload.get("x509_presented")

        return LoginGovUser(user_id=user_id, email=email, x509_presented=x509_presented)

    # Most exceptions will result in an outright error
    # as the only change to calls to this function are the public keys
    # we use to validate. Unless it is a public-key-validation related error
    # just reraise as a JwtValidationError here
    except KeyError as e:
        raise JwtValidationError("Token Missing Required Field(s)") from e
    except jwt.ExpiredSignatureError as e:
        raise JwtValidationError("Expired Token") from e
    except jwt.ImmatureSignatureError as e:  # IAT and NBF errors hit this
        raise JwtValidationError("Token not yet valid") from e
    except jwt.InvalidIssuerError as e:
        raise JwtValidationError("Unknown Issuer") from e
    except jwt.InvalidAudienceError as e:
        raise JwtValidationError("Unknown Audience") from e
    except jwt.InvalidSignatureError as e:  # Token signature does not match
        raise JwtValidationError("Invalid Signature") from e
    except jwt.PyJWTError as e:  # Every other type of JWT error not caught above
        raise JwtValidationError("Unable to process token") from e
