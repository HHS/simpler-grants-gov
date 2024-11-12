
import dataclasses
import jwt
from pydantic import Field
from src.util.env_config import PydanticBaseEnvConfig


class LoginGovConfig(PydanticBaseEnvConfig):


    # TODO - actually hook this up to env vars in some manner

    # TODO - public keys should be something we can configure from
    # an env var but only ever do so from local - otherwise
    # when we create it it will load.
    public_keys: list[jwt.PyJWK | str] = Field(alias="LOGIN_GOV_PUBLIC_KEYS", default_factory=list)
    login_gov_jwk_endpoint: str = Field(alias="LOGIN_GOV_JWK_ENDPOINT")

    encryption_algorithm: str = Field(alias="LOGIN_GOV_ENCRYPTION_ALGORITHM", default="RS256")

    login_gov_endpoint: str = Field(alias="LOGIN_GOV_ENDPOINT")
    client_id: str = Field(alias="LOGIN_GOV_CLIENT_ID")

def get_login_gov_config() -> LoginGovConfig:
    config = LoginGovConfig()
    refresh_keys(config)
    return config

@dataclasses.dataclass
class LoginGovUser:
    user_id: str
    email: str

class JwtValidationError(Exception):
    """
    Exception we will reraise if there are
    any issues processing a JWT that should
    cause the validation to error out
    """
    pass

def refresh_keys(config: LoginGovConfig) -> None:
    jwk_client = jwt.PyJWKClient(config.login_gov_jwk_endpoint)
    public_keys = jwk_client.get_jwk_set().keys
    config.public_keys = public_keys

def validate_token(token: str, config: LoginGovConfig) -> LoginGovUser:

    # TODO - this iteration approach won't be necessary if the JWT we get
    #        from login.gov does actually set the KID in the header
    for public_key in config.public_keys:
        user = _validate_token_with_key(token, public_key, config)
        if user is not None:
            return user

    refresh_keys(config)

    for public_key in config.public_keys:
        user = _validate_token_with_key(token, public_key, config)
        if user is not None:
            return user

    raise JwtValidationError("Token could not be validated against any public keys from login.gov")

def _validate_token_with_key(token: str, public_key: jwt.PyJWK, config: LoginGovConfig) -> LoginGovUser | None:
    # We are processing the id_token as described on:
    # https://developers.login.gov/oidc/token/#token-response
    try:
        data = jwt.api_jwt.decode_complete(token,
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
        })
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
    except jwt.ImmatureSignatureError as e: # IAT and NBF errors hit this
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
    except jwt.PyJWTError as e: # Every other type of JWT error not caught above
        raise JwtValidationError("Unable to process token") from e