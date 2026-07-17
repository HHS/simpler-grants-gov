import logging
import uuid
from typing import Self

import grants_shared.adapters.db as db
from grants_shared.auth.api_jwt_auth import ApiJwtConfig

import tests.db.models.factories as factories
from src.auth.api_jwt_auth import create_jwt_for_user
from src.db.models.user_models import MgmtUser

logger = logging.getLogger(__name__)


class UserBuilder:
    """Builder class for setting up a user for local development"""

    def __init__(self, user_id: uuid.UUID, db_session: db.Session, scenario_name: str) -> None:
        self.user: MgmtUser = db_session.merge(
            factories.MgmtUserFactory.build(mgmt_user_id=user_id), load=True
        )
        self.db_session = db_session
        self.scenario_name = scenario_name

        self.link_external_id = None
        self.api_key_id = None
        self.jwt_token = None

    def with_oauth_login(self, external_user_id: str) -> Self:
        """Add an oauth login record that you can use to login as a user

        For example, if you passed in "my_example_user", you could
        manually login to that user by typing "my_example_user" into
        the Mock OAuth login page.
        """
        external_user = self.user.linked_login_gov_external_user
        if external_user is None:
            external_user = factories.MgmtLinkExternalUserFactory.build(mgmt_user=self.user)

        external_user.external_user_id = external_user_id
        self.db_session.add(external_user)

        self.link_external_id = external_user_id
        return self

    def with_jwt_auth(self, token_expiration_minutes: int = 60 * 24 * 365 * 30) -> Self:
        """Add API jwt auth to the user. By default it will expire 30 years in the future for easier development."""
        config = ApiJwtConfig(API_JWT_TOKEN_EXPIRATION_MINUTES=token_expiration_minutes)
        token, _ = create_jwt_for_user(
            self.user, self.db_session, config=config, email=self.user.email
        )
        self.jwt_token = token
        return self

    def with_api_key(self, key_id: str, key_name: str = "Local Development Key") -> Self:
        """Add an API key to the user for X-API-Key authentication.
        
        For example, if you passed in "my_test_key", you could authenticate
        by passing X-API-Key: my_test_key in your request headers.
        """
        api_key = factories.MgmtUserApiKeyFactory.build(
            mgmt_user=self.user, key_id=key_id, key_name=key_name, is_active=True
        )
        self.db_session.add(api_key)
        self.api_key_id = key_id
        return self

    def build(self) -> MgmtUser:
        log_msg = f"Updating {self.scenario_name}:"
        if self.link_external_id:
            log_msg += f" '{self.link_external_id}'"
        if self.jwt_token:
            log_msg += f" with X-MGMT-Token: '{self.jwt_token}'"
        if self.api_key_id:
            log_msg += f" with X-API-Key: '{self.api_key_id}'"
        logger.info(log_msg)
        return self.user
