"""Auth handler abstraction.

The generic authN logic should not query or construct the concrete user tables
directly. Instead it goes through an :class:`AbstractAuthHandler`, which defines the
shape of every DB interaction the auth flow needs in terms of the abstract base models
(see ``auth_base_models.py``). The concrete :class:`AuthHandler` supplies the real
tables.

This lets the generic auth logic be shared without depending on the concrete API tables.
"""

import abc
import uuid
from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from grants_shared.adapters import db
from grants_shared.db.models.auth_base_models import (
    BaseLinkExternalUser,
    BaseLoginGovState,
    BaseUser,
    BaseUserApiKey,
    BaseUserTokenSession,
)


# Type parameters bind the abstract models to concrete tables so handlers avoid casting.
# Multi-letter names (rather than the usual single letter) since there are five.
class AbstractAuthHandler[
    USER: BaseUser,
    LINK_EXTERNAL: BaseLinkExternalUser,
    LOGIN_GOV_STATE: BaseLoginGovState,
    USER_API_KEY: BaseUserApiKey,
    USER_TOKEN_SESSION: BaseUserTokenSession,
](abc.ABC, metaclass=abc.ABCMeta):
    """Defines the DB interactions the auth flow relies on, in terms of abstract models.

    Concrete implementations supply the actual queries and object construction against
    real tables, binding the type parameters to their concrete models.
    """

    def __init__(self, db_session: db.Session):
        self.db_session = db_session

    # --- User token sessions ---

    @abc.abstractmethod
    def create_token_session(
        self, user: USER, token_id: uuid.UUID, expires_at: datetime
    ) -> USER_TOKEN_SESSION: ...

    @abc.abstractmethod
    def get_token_session_by_token_id(self, token_id: str) -> USER_TOKEN_SESSION | None: ...

    # --- API keys ---

    @abc.abstractmethod
    def get_api_key_by_key_id(self, key_id: str) -> USER_API_KEY | None: ...

    @abc.abstractmethod
    def create_api_key(self, user_id: UUID, key_name: str, key_id: str) -> USER_API_KEY: ...

    @abc.abstractmethod
    def list_api_keys_for_user(self, user_id: UUID) -> Sequence[USER_API_KEY]: ...

    @abc.abstractmethod
    def get_api_key_for_user(self, user_id: UUID, api_key_id: UUID) -> USER_API_KEY | None: ...

    # --- login.gov state ---

    @abc.abstractmethod
    def create_login_gov_state(self, state_id: uuid.UUID, nonce: uuid.UUID) -> LOGIN_GOV_STATE: ...

    @abc.abstractmethod
    def get_login_gov_state(self, state_id: str) -> LOGIN_GOV_STATE | None: ...

    # --- External user link / user creation ---

    @abc.abstractmethod
    def get_link_external_user(self, external_user_id: str) -> LINK_EXTERNAL | None: ...

    @abc.abstractmethod
    def create_user_with_external_link(self, external_user_id: str) -> LINK_EXTERNAL: ...

    @abc.abstractmethod
    def get_user_for_external_link(self, external_user: LINK_EXTERNAL) -> USER: ...
