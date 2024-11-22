import dataclasses
import logging

import jwt
from pydantic import Field

from src.auth.auth_errors import JwtValidationError
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class LoginGovConfig(PydanticBaseEnvConfig):
    """
    Configuration for login.gov JWT auth

    Do not create this directly, instead call get_login_gov_config
    which will handle setting it up for you.
    """

    # Public keys likely won't ever be set by an env var, so it defaults
    # to an empty list and gets overriden by any call to _refresh_keys
    public_keys: list[jwt.PyJWK | str] = Field(alias="LOGIN_GOV_PUBLIC_KEYS", default_factory=list)
    login_gov_jwk_endpoint: str = Field(alias="LOGIN_GOV_JWK_ENDPOINT")

    encryption_algorithm: str = Field(alias="LOGIN_GOV_ENCRYPTION_ALGORITHM", default="RS256")

    login_gov_endpoint: str = Field(alias="LOGIN_GOV_ENDPOINT")
    client_id: str = Field(alias="LOGIN_GOV_CLIENT_ID")


# Initialize a config at startup
_config: LoginGovConfig | None = None


def initialize_login_gov_config() -> None:
    global _config
    if not _config:
        _config = LoginGovConfig()
        _refresh_keys(_config)

        logger.info(
            "Constructed login.gov configuration",
            extra={
                "login_gov_jwk_endpoint": _config.login_gov_jwk_endpoint,
                "login_gov_endpoint": _config.login_gov_endpoint,
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
    public_keys = jwk_client.get_jwk_set().keys

    # This line is possibly an issue for the reasons described above.
    config.public_keys = list(public_keys)


def validate_token(token: str, config: LoginGovConfig | None = None) -> LoginGovUser:
    if not config:
        config = get_config()

    # TODO - this iteration approach won't be necessary if the JWT we get
    #        from login.gov does actually set the KID in the header
    # Iterate over the public keys we have and check each
    # to determine if we have a valid key.
    for public_key in config.public_keys:
        user = _validate_token_with_key(token, public_key, config)
        if user is not None:
            return user

    _refresh_keys(config)

    for public_key in config.public_keys:
        user = _validate_token_with_key(token, public_key, config)
        if user is not None:
            return user

    raise JwtValidationError("Token could not be validated against any public keys from login.gov")


def _validate_token_with_key(
    token: str, public_key: jwt.PyJWK | str, config: LoginGovConfig
) -> LoginGovUser | None:
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

        user_id = payload["sub"]
        email = payload["email"]

        return LoginGovUser(user_id=user_id, email=email)

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
    except jwt.InvalidSignatureError:
        # This occurs if the validation fails for the key.
        # Since we might be checking against the wrong key (unless we get a KID)
        # we don't want to error necessarily
        return None
    except jwt.PyJWTError as e:  # Every other type of JWT error not caught above
        raise JwtValidationError("Unable to process token") from e
