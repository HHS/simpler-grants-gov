from dataclasses import dataclass
from enum import StrEnum

from apiflask import MultiAuth
from apiflask.types import HTTPAuthType

from ..db.models.competition_models import ShortLivedInternalToken
from ..db.models.user_models import User, UserApiKey, UserTokenSession
from .api_jwt_auth import api_jwt_auth
from .api_key_auth import ApiKeyUser, api_key_auth
from .api_user_key_auth import api_user_key_auth
from .internal_jwt_auth import internal_jwt_auth


class AuthType(StrEnum):
    API_KEY_AUTH = "api_key_auth"
    API_USER_KEY_AUTH = "api_user_key_auth"
    USER_JWT_AUTH = "user_jwt_auth"
    INTERNAL_JWT_AUTH = "internal_jwt_auth"


@dataclass
class MultiAuthUser:
    user: UserTokenSession | ApiKeyUser | UserApiKey | ShortLivedInternalToken
    auth_type: AuthType


class MultiHttpTokenAuth(MultiAuth):

    def get_user(self) -> MultiAuthUser:
        current_user = self.current_user

        if isinstance(current_user, ApiKeyUser):
            return MultiAuthUser(current_user, AuthType.API_KEY_AUTH)

        elif isinstance(current_user, UserApiKey):
            return MultiAuthUser(current_user, AuthType.API_USER_KEY_AUTH)

        elif isinstance(current_user, UserTokenSession):
            return MultiAuthUser(current_user, AuthType.USER_JWT_AUTH)

        elif isinstance(current_user, ShortLivedInternalToken):
            return MultiAuthUser(current_user, AuthType.INTERNAL_JWT_AUTH)

        raise Exception("Unknown user type %s", type(current_user))

    @property
    def _auths(self) -> list[HTTPAuthType]:
        # Override the parent _auths because it assumes the field it wants
        # is additional_auth and that was recently renamed to additional_auths
        # This just grabs both. Once APIFlask fixes this, we can remove this.
        return (
            [self.main_auth]
            + list(getattr(self, "additional_auth", []))
            + list(getattr(self, "additional_auths", []))
        )


class MultiHttpTokenAuthSimpler(MultiAuth):
    def get_user(self) -> User:
        current_user = self.current_user

        if isinstance(current_user, UserTokenSession) or isinstance(current_user, UserApiKey):
            return current_user.user

        raise Exception(f"Unsupported user type: {type(current_user)}")

    @property
    def _auths(self) -> list[HTTPAuthType]:
        # Override the parent _auths because it assumes the field it wants
        # is additional_auth and that was recently renamed to additional_auths
        # This just grabs both. Once APIFlask fixes this, we can remove this.
        return (
            [self.main_auth]
            + list(getattr(self, "additional_auth", []))
            + list(getattr(self, "additional_auths", []))
        )


# Define the multi auth that supports
# * User JWT auth
# * API Key Auth
# * Internal JWT auth
#
# This is specifically for application endpoints that need to support internal services
jwt_key_or_internal_multi_auth = MultiHttpTokenAuth(api_jwt_auth, internal_jwt_auth)


# Define the multi auth that supports both API key authentication methods:
# * Database-based API Gateway Key Auth (X-API-Key header)
# * Environment-based API Key Auth (X-Auth header)
#
# Note that the order matters - api_user_key_auth will take precedence if both headers are present
api_key_multi_auth = MultiHttpTokenAuth(api_user_key_auth, api_key_auth)


# Define the multi auth that supports
# * User JWT auth
# * API User Key Auth
#
# Note that the order defined matters - earlier ones will take precedence in
# the event a user provides us with multiple auth approaches at once, only the first
# relevant one will be used
# We define the JWT auth first as the frontend will pass us a users JWT
# and the frontend's API key for all user-based requests in order to validate
# with our API gateway that handles rate limiting.
jwt_or_api_user_key_multi_auth = MultiHttpTokenAuthSimpler(api_jwt_auth, api_user_key_auth)
