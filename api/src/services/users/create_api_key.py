import logging
import uuid
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.adapters.aws.api_gateway_adapter import ApiGatewayConfig, import_api_key
from src.db.models.user_models import UserApiKey
from src.util.api_key_gen import generate_api_key_id

logger = logging.getLogger(__name__)

# Maximum number of retries for key generation
MAX_KEY_GENERATION_RETRIES = 5


class KeyGenerationError(Exception):
    """Raised when unable to generate a unique API key after multiple retries."""

    pass


class ApiGatewayIntegrationError(Exception):
    """Raised when there's an error integrating with AWS API Gateway."""

    pass


class CreateApiKeyParams:
    """Simple parameter extraction for API key creation"""

    def __init__(self, json_data: dict):
        self.key_name = json_data["key_name"]


def create_api_key(db_session: db.Session, user_id: UUID, json_data: dict) -> UserApiKey:
    params = CreateApiKeyParams(json_data)

    key_name = params.key_name
    is_active = True

    # Generate a unique key_id with collision detection
    key_id = _generate_unique_key_id(db_session)

    # Create the new API key in our database first
    api_key = UserApiKey(
        api_key_id=uuid.uuid4(),
        user_id=user_id,
        key_name=key_name,
        key_id=key_id,
        is_active=is_active,
    )
    db_session.add(api_key)

    # Import the API key to AWS API Gateway
    _import_api_key_to_aws_gateway(api_key)

    logger.info(
        "Created new API key",
        extra={
            "api_key_id": api_key.api_key_id,
            "user_id": user_id,
            "key_name": key_name,
            "is_active": is_active,
        },
    )

    return api_key


def _import_api_key_to_aws_gateway(api_key: UserApiKey) -> None:
    """Import an API key to AWS API Gateway and associate it with a usage plan"""
    try:
        config = ApiGatewayConfig()

        gateway_response = import_api_key(
            api_key=api_key.key_id,
            name=api_key.key_name,
            description=f"API key for user {api_key.user_id}",
            enabled=api_key.is_active,
            usage_plan_id=config.default_usage_plan_id,
        )

        logger.info(
            "Successfully imported API key to AWS API Gateway and associated with usage plan",
            extra={
                "api_key_id": api_key.api_key_id,
                "gateway_key_id": gateway_response.id,
                "usage_plan_id": config.default_usage_plan_id,
            },
        )

    except Exception as e:
        # Re-raise as a domain-specific exception without additional logging
        # since the AWS adapter already logs the underlying error
        raise ApiGatewayIntegrationError("Failed to import API key to AWS API Gateway") from e


def _generate_unique_key_id(db_session: db.Session) -> str:
    for _attempt in range(MAX_KEY_GENERATION_RETRIES):
        key_id = generate_api_key_id()

        # Check if this key_id already exists
        existing_key = db_session.execute(
            select(UserApiKey).filter(UserApiKey.key_id == key_id)
        ).scalar_one_or_none()

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
