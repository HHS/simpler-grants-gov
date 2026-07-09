import uuid
from collections.abc import Sequence
from datetime import datetime

from grants_shared.auth.auth_handler import AbstractAuthHandler
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.constants.lookup_constants import ExternalUserType
from src.db.models.user_models import (
    MgmtLinkExternalUser,
    MgmtLoginGovState,
    MgmtUser,
    MgmtUserApiKey,
    MgmtUserTokenSession,
)


class MgmtAuthHandler(
    AbstractAuthHandler[
        MgmtUser, MgmtLinkExternalUser, MgmtLoginGovState, MgmtUserApiKey, MgmtUserTokenSession
    ]
):
    """Concrete auth handler backed by the grants management user tables."""

    # --- User token sessions ---

    def create_token_session(
        self, user: MgmtUser, token_id: uuid.UUID, expires_at: datetime
    ) -> MgmtUserTokenSession:
        user_token_session = MgmtUserTokenSession(
            mgmt_user=user, token_id=token_id, expires_at=expires_at
        )
        self.db_session.add(user_token_session)
        return user_token_session

    def get_token_session_by_token_id(self, token_id: str) -> MgmtUserTokenSession | None:
        return self.db_session.execute(
            select(MgmtUserTokenSession)
            .where(MgmtUserTokenSession.token_id == token_id)
            .options(selectinload(MgmtUserTokenSession.mgmt_user))
        ).scalar()

    # --- API keys ---

    def get_api_key_by_key_id(self, key_id: str) -> MgmtUserApiKey | None:
        return self.db_session.execute(
            select(MgmtUserApiKey)
            .where(MgmtUserApiKey.key_id == key_id)
            .options(selectinload(MgmtUserApiKey.mgmt_user))
        ).scalar_one_or_none()

    def create_api_key(self, user_id: uuid.UUID, key_name: str, key_id: str) -> MgmtUserApiKey:
        api_key = MgmtUserApiKey(
            mgmt_api_key_id=uuid.uuid4(),
            mgmt_user_id=user_id,
            key_name=key_name,
            key_id=key_id,
            is_active=True,
        )
        self.db_session.add(api_key)
        return api_key

    def list_api_keys_for_user(self, user_id: uuid.UUID) -> Sequence[MgmtUserApiKey]:
        result = self.db_session.execute(
            select(MgmtUserApiKey)
            .where(MgmtUserApiKey.mgmt_user_id == user_id)
            .order_by(MgmtUserApiKey.created_at.desc())
        )
        return list(result.scalars().all())

    def get_api_key_for_user(
        self, user_id: uuid.UUID, api_key_id: uuid.UUID
    ) -> MgmtUserApiKey | None:
        return self.db_session.execute(
            select(MgmtUserApiKey).filter(
                MgmtUserApiKey.mgmt_api_key_id == api_key_id,
                MgmtUserApiKey.mgmt_user_id == user_id,
            )
        ).scalar_one_or_none()

    # --- login.gov state ---

    def create_login_gov_state(self, state_id: uuid.UUID, nonce: uuid.UUID) -> MgmtLoginGovState:
        login_gov_state = MgmtLoginGovState(mgmt_login_gov_state_id=state_id, nonce=nonce)
        self.db_session.add(login_gov_state)
        return login_gov_state

    def get_login_gov_state(self, state_id: str) -> MgmtLoginGovState | None:
        return self.db_session.execute(
            select(MgmtLoginGovState).where(MgmtLoginGovState.mgmt_login_gov_state_id == state_id)
        ).scalar_one_or_none()

    # --- External user link / user creation ---

    def get_link_external_user(self, external_user_id: str) -> MgmtLinkExternalUser | None:
        return self.db_session.execute(
            select(MgmtLinkExternalUser)
            .where(MgmtLinkExternalUser.external_user_id == external_user_id)
            # We only support login.gov right now, so this does nothing, but let's
            # be explicit just in case.
            .where(MgmtLinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV)
            .options(selectinload(MgmtLinkExternalUser.mgmt_user))
        ).scalar()

    def create_user_with_external_link(self, external_user_id: str) -> MgmtLinkExternalUser:
        user = MgmtUser()
        self.db_session.add(user)

        external_user = MgmtLinkExternalUser(
            mgmt_user=user,
            external_user_type=ExternalUserType.LOGIN_GOV,
            external_user_id=external_user_id,
            # note we set other params in the calling method to also handle updates
        )
        self.db_session.add(external_user)

        return external_user

    def get_user_for_external_link(self, external_user: MgmtLinkExternalUser) -> MgmtUser:
        return external_user.mgmt_user
