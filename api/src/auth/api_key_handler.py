from grants_shared.auth.api_key_handler import AbstractApiKeyHandler

from src.auth.auth_handler import AuthHandler
from src.db.models.user_models import UserApiKey


class SimplerApiKeyHandler(AbstractApiKeyHandler[UserApiKey]):

    def get_auth_handler(self) -> AuthHandler:
        return AuthHandler(self.db_session)
