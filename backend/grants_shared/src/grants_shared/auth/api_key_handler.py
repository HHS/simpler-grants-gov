import abc
import logging
from collections.abc import Sequence
from typing import Any
from uuid import UUID

from grants_shared.adapters import db
from grants_shared.adapters.aws.api_gateway_adapter import ApiGatewayConfig, import_api_key
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.auth.auth_handler import AbstractAuthHandler
from grants_shared.db.models.auth_base_models import BaseUserApiKey
from grants_shared.util.api_key_gen import generate_api_key_id

logger = logging.getLogger(__name__)

# Maximum number of retries for key generation
MAX_KEY_GENERATION_RETRIES = 5


class KeyGenerationError(Exception):
    """Raised when unable to generate a unique API key after multiple retries."""

    pass


class ApiGatewayIntegrationError(Exception):
    """Raised when there's an error integrating with AWS API Gateway."""

    pass


class AbstractApiKeyHandler[USER_API_KEY: BaseUserApiKey](abc.ABC, metaclass=abc.ABCMeta):

    def __init__(self, db_session: db.Session):
        self.db_session = db_session

    @abc.abstractmethod
    def get_auth_handler(self) -> AbstractAuthHandler[Any, Any, Any, USER_API_KEY, Any]:
        """Get the auth handler that backs this key handler"""
        pass

    def create_api_key(self, user_id: UUID, key_name: str) -> USER_API_KEY:
        """Create an API key for a user and associate with API gateway"""
        # Generate a unique key_id with collision detection
        key_id = self._generate_unique_key_id()

        # Create the new API key in our database first
        api_key = self.get_auth_handler().create_api_key(user_id, key_name, key_id)

        # Import the API key to AWS API Gateway
        self._import_api_key_to_aws_gateway(api_key)

        logger.info(
            "Created new API key",
            extra=api_key.get_log_extra(),
        )

        return api_key

    def get_user_api_keys(self, user_id: UUID) -> Sequence[USER_API_KEY]:
        """Get a user's API keys"""
        logger.info("Getting API keys for user", extra={"user_id": user_id})

        api_keys = self.get_auth_handler().list_api_keys_for_user(user_id)

        logger.info(
            "Retrieved API keys for user",
            extra={
                "user_id": user_id,
                "api_key_count": len(api_keys),
            },
        )

        return api_keys

    def get_user_api_key(self, user_id: UUID, api_key_id: UUID) -> USER_API_KEY:
        """Get a specific API key for a user"""
        logger.info(
            "Getting specific API key for user",
            extra={
                "user_id": user_id,
                "api_key_id": api_key_id,
            },
        )

        api_key = self.get_auth_handler().get_api_key_for_user(user_id, api_key_id)

        if api_key is None:
            raise_flask_error(404, "API key not found")

        logger.info(
            "Retrieved specific API key for user",
            extra={
                "user_id": user_id,
                "api_key_id": api_key_id,
            },
        )

        return api_key

    def delete_api_key(self, user_id: UUID, api_key_id: UUID) -> None:
        """Delete an API key for a user"""
        api_key = self.get_user_api_key(user_id, api_key_id)

        self.db_session.delete(api_key)

        logger.info(
            "Deleted API key",
            extra=api_key.get_log_extra(),
        )

    def rename_api_key(self, user_id: UUID, api_key_id: UUID, key_name: str) -> USER_API_KEY:
        """Rename an existing API key for a user"""
        api_key = self.get_user_api_key(user_id, api_key_id)
        api_key.key_name = key_name

        logger.info(
            "Renamed API key",
            extra=api_key.get_log_extra(),
        )

        return api_key

    def _import_api_key_to_aws_gateway(self, api_key: USER_API_KEY) -> None:
        """Import an API key to AWS API Gateway and associate it with a usage plan"""
        try:
            config = ApiGatewayConfig()

            # Use the log extra to get info for the description we put in api gateway
            # Will look like "api_key_id=<uuid>, user_id=<uuid>" depending on what is added to the
            # log extra function of the derived implementation.
            description_info = ", ".join(
                [f"{k.removeprefix('auth.')}={v}" for k, v in api_key.get_log_extra().items()]
            )

            gateway_response = import_api_key(
                api_key=api_key.key_id,
                name=api_key.key_name,
                description=f"API key for {description_info}",
                enabled=api_key.is_active,
                usage_plan_id=config.default_usage_plan_id,
            )

            logger.info(
                "Successfully imported API key to AWS API Gateway and associated with usage plan",
                extra={
                    "gateway_key_id": gateway_response.id,
                    "usage_plan_id": config.default_usage_plan_id,
                }
                | api_key.get_log_extra(),
            )

        except Exception as e:
            # Re-raise as a domain-specific exception without additional logging
            # since the AWS adapter already logs the underlying error
            raise ApiGatewayIntegrationError("Failed to import API key to AWS API Gateway") from e

    def _generate_unique_key_id(self) -> str:
        for _attempt in range(MAX_KEY_GENERATION_RETRIES):
            key_id = generate_api_key_id()

            # Check if this key_id already exists
            existing_key = self.get_auth_handler().get_api_key_by_key_id(key_id)

            if existing_key is None:
                return key_id

        # If we get here, we failed to generate a unique key after all retries
        logger.error(
            "Failed to generate unique key_id after maximum retries",
            extra={"max_retries": MAX_KEY_GENERATION_RETRIES},
        )
        raise KeyGenerationError(
            f"Unable to generate unique API key after {MAX_KEY_GENERATION_RETRIES} attempts"
        )
