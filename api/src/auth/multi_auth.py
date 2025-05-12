from dataclasses import dataclass
from enum import StrEnum

from flask_httpauth import MultiAuth

from ..db.models.user_models import UserTokenSession
from .api_jwt_auth import api_jwt_auth
from .api_key_auth import ApiKeyUser, api_key_auth


class AuthType(StrEnum):
    API_KEY_AUTH = "api_key_auth"
    USER_JWT_AUTH = "user_jwt_auth"


@dataclass
class MultiAuthUser:
    user: UserTokenSession | ApiKeyUser
    auth_type: AuthType


class MultiHttpTokenAuth(MultiAuth):

    def get_user(self) -> MultiAuthUser:
        current_user = self.current_user()

        if isinstance(current_user, ApiKeyUser):
            return MultiAuthUser(current_user, AuthType.API_KEY_AUTH)

        elif isinstance(current_user, UserTokenSession):
            return MultiAuthUser(current_user, AuthType.USER_JWT_AUTH)

        raise Exception("Unknown user type %s", type(current_user))


# Define the multi auth that supports
# * User JWT auth
# * API Key Auth
#
# Note that the order defined matters - earlier ones will take precedence in
# the event a user provides us with multiple auth approaches at once, only the first
# relevant one will be used
jwt_or_key_multi_auth = MultiHttpTokenAuth(api_jwt_auth, api_key_auth)

jwt_or_key_security_schemes = [api_jwt_auth.security_scheme_name, api_key_auth.security_scheme_name]
