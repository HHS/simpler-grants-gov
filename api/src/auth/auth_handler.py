"""Auth handler abstraction.

The generic authN logic should not query or construct the concrete user tables
directly. Instead it goes through an :class:`AbstractAuthHandler`, which defines the
shape of every DB interaction the auth flow needs in terms of the abstract base models
(see ``auth_base_models.py``). The concrete :class:`AuthHandler` supplies the real
tables.

This lets the generic auth logic be shared without depending on the concrete API tables.
"""

# import abc
import uuid
from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from grants_shared.adapters import db
from grants_shared.auth.auth_handler import AbstractAuthHandler
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.constants.lookup_constants import ExternalUserType
from src.db.models.user_models import (
    LinkExternalUser,
    LoginGovState,
    User,
    UserApiKey,
    UserTokenSession,
)


class AuthHandler(
    AbstractAuthHandler[User, LinkExternalUser, LoginGovState, UserApiKey, UserTokenSession]
):
    """Concrete auth handler backed by the API's user tables."""

    # --- User token sessions ---

    def create_token_session(
        self, user: User, token_id: uuid.UUID, expires_at: datetime
    ) -> UserTokenSession:
        user_token_session = UserTokenSession(user=user, token_id=token_id, expires_at=expires_at)
        self.db_session.add(user_token_session)
        return user_token_session

    def get_token_session_by_token_id(self, token_id: str) -> UserTokenSession | None:
        return self.db_session.execute(
            select(UserTokenSession)
            .where(UserTokenSession.token_id == token_id)
            .options(selectinload(UserTokenSession.user))
        ).scalar()

    # --- API keys ---

    def get_api_key_by_key_id(self, key_id: str) -> UserApiKey | None:
        return self.db_session.execute(
            select(UserApiKey)
            .where(UserApiKey.key_id == key_id)
            .options(selectinload(UserApiKey.user))
        ).scalar_one_or_none()

    def create_api_key(self, user_id: UUID, key_name: str, key_id: str) -> UserApiKey:
        api_key = UserApiKey(
            api_key_id=uuid.uuid4(),
            user_id=user_id,
            key_name=key_name,
            key_id=key_id,
            is_active=True,
        )
        self.db_session.add(api_key)
        return api_key

    def list_api_keys_for_user(self, user_id: UUID) -> Sequence[UserApiKey]:
        result = self.db_session.execute(
            select(UserApiKey)
            .where(UserApiKey.user_id == user_id)
            .order_by(UserApiKey.created_at.desc())
        )
        return list(result.scalars().all())

    def get_api_key_for_user(self, user_id: UUID, api_key_id: UUID) -> UserApiKey | None:
        return self.db_session.execute(
            select(UserApiKey).filter(
                UserApiKey.api_key_id == api_key_id,
                UserApiKey.user_id == user_id,
            )
        ).scalar_one_or_none()

    # --- login.gov state ---

    def create_login_gov_state(self, state_id: uuid.UUID, nonce: uuid.UUID) -> LoginGovState:
        login_gov_state = LoginGovState(login_gov_state_id=state_id, nonce=nonce)
        self.db_session.add(login_gov_state)
        return login_gov_state

    def get_login_gov_state(self, state_id: str) -> LoginGovState | None:
        return self.db_session.execute(
            select(LoginGovState).where(LoginGovState.login_gov_state_id == state_id)
        ).scalar_one_or_none()

    # --- External user link / user creation ---

    def get_link_external_user(self, external_user_id: str) -> LinkExternalUser | None:
        return self.db_session.execute(
            select(LinkExternalUser)
            .where(LinkExternalUser.external_user_id == external_user_id)
            # We only support login.gov right now, so this does nothing, but let's
            # be explicit just in case.
            .where(LinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV)
            .options(selectinload(LinkExternalUser.user).selectinload(User.agency_users))
        ).scalar()

    def create_user_with_external_link(self, external_user_id: str) -> LinkExternalUser:
        user = User()
        self.db_session.add(user)

        external_user = LinkExternalUser(
            user=user,
            external_user_type=ExternalUserType.LOGIN_GOV,
            external_user_id=external_user_id,
            # note we set other params in the calling method to also handle updates
        )
        self.db_session.add(external_user)

        return external_user

    def get_user_for_external_link(self, external_user: LinkExternalUser) -> User:
        return external_user.user


# TODO: When the generic auth logic moves to grants_shared, the shared code can no longer
# instantiate the concrete AuthHandler. This hardcoded factory must move to the API side --
# replace it with a registration/injection hook where the API registers its concrete handler.
#
# The return type is the unparameterized AbstractAuthHandler on purpose: the generic auth
# layer interacts with it through the abstract base models, not the concrete tables. Binding
# the concrete type params here would force the generic callers (which hold BaseUser, etc.)
# to know about the real tables.
def get_auth_handler(db_session: db.Session) -> AbstractAuthHandler:
    return AuthHandler(db_session)
