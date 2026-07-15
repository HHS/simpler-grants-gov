import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from grants_shared.auth.api_key_handler import AbstractApiKeyHandler
from grants_shared.auth.auth_handler import AbstractAuthHandler
from tests.grants_shared.db_test_models.db_test_models import (
    SharedLinkExternalUser,
    SharedLoginGovState,
    SharedUser,
    SharedUserApiKey,
    SharedUserTokenSession,
)


class AuthHandler(
    AbstractAuthHandler[
        SharedUser,
        SharedLinkExternalUser,
        SharedLoginGovState,
        SharedUserApiKey,
        SharedUserTokenSession,
    ]
):
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

    def get_api_key_by_key_id(self, key_id: uuid.UUID) -> SharedUserApiKey | None:
        return self.db_session.execute(
            select(SharedUserApiKey)
            .where(SharedUserApiKey.key_id == key_id)
            .options(selectinload(SharedUserApiKey.shared_user))
        ).scalar_one_or_none()

    def create_api_key(
        self, user_id: uuid.UUID, key_name: str, key_id: uuid.UUID
    ) -> SharedUserApiKey:
        api_key = SharedUserApiKey(
            shared_api_key_id=uuid.uuid4(),
            shared_user_id=user_id,
            key_name=key_name,
            key_id=key_id,
            is_active=True,
        )
        self.db_session.add(api_key)
        return api_key

    def list_api_keys_for_user(self, user_id: uuid.UUID) -> Sequence[SharedUserApiKey]:
        result = self.db_session.execute(
            select(SharedUserApiKey)
            .where(SharedUserApiKey.shared_user_id == user_id)
            .order_by(SharedUserApiKey.created_at.desc())
        )
        return list(result.scalars().all())

    def get_api_key_for_user(
        self, user_id: uuid.UUID, api_key_id: uuid.UUID
    ) -> SharedUserApiKey | None:
        return self.db_session.execute(
            select(SharedUserApiKey).filter(
                SharedUserApiKey.shared_api_key_id == api_key_id,
                SharedUserApiKey.shared_user_id == user_id,
            )
        ).scalar_one_or_none()

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


class SharedApiKeyHandler(AbstractApiKeyHandler[SharedUserApiKey]):

    def get_auth_handler(self) -> AuthHandler:
        return AuthHandler(self.db_session)
