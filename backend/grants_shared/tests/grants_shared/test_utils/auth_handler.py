from sqlalchemy import select
from sqlalchemy.orm import selectinload

from grants_shared.auth.auth_handler import AbstractAuthHandler
from tests.grants_shared.db_test_models.db_test_models import (
    SharedLoginGovState,
    SharedUserTokenSession,
)


class AuthHandler(AbstractAuthHandler):
    """Concrete auth handler backed by the API's user tables."""

    def create_token_session(self, user, token_id, expires_at):
        user_token_session = SharedUserTokenSession(
            shared_user=user, token_id=token_id, expires_at=expires_at
        )
        self.db_session.add(user_token_session)
        return user_token_session

    def get_token_session_by_token_id(self, token_id: str) -> SharedUserTokenSession | None:
        return self.db_session.execute(
            select(SharedUserTokenSession)
            .where(SharedUserTokenSession.token_id == token_id)
            .options(selectinload(SharedUserTokenSession.shared_user))
        ).scalar()

    def get_api_key_by_key_id(self, key_id): ...

    def create_api_key(self, user_id, key_name, key_id): ...

    def list_api_keys_for_user(self, user_id): ...

    def get_api_key_for_user(self, user_id, api_key_id): ...

    def create_login_gov_state(self, state_id, nonce): ...

    def get_login_gov_state(self, state_id):
        return self.db_session.execute(
            select(SharedLoginGovState).where(
                SharedLoginGovState.shared_login_gov_state_id == state_id
            )
        ).scalar_one_or_none()

    def get_link_external_user(self, external_user_id): ...

    def create_user_with_external_link(self, external_user_id: str): ...

    def get_user_for_external_link(self, external_user):
        return external_user.user
