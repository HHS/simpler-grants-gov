import uuid

from src.util.env_config import PydanticBaseEnvConfig


class WorkflowServiceConfig(PydanticBaseEnvConfig):
    """Configuration class for the workflow service as a whole."""

    workflow_service_internal_user_id: uuid.UUID  # WORKFLOW_SERVICE_INTERNAL_USER_ID
