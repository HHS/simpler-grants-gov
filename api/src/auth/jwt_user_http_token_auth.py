from typing import cast

from apiflask import APIKeyHeaderAuth

from src.db.models.user_models import UserTokenSession


class JwtUserHttpTokenAuth(APIKeyHeaderAuth):

    def get_user_token_session(self) -> UserTokenSession:
        """Wrapper method around the current_user value to handle type issues

        Note that this value gets set based on whatever is returned from the method
        you configure for @<your JwtUserHttpTokenAuth obj>.verify_token
        """
        return cast(UserTokenSession, self.current_user)
