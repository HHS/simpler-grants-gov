import abc
import logging

from src.db.models.competition_models import Form
from src.form_schema.forms import get_active_forms, init_form_registry
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

# URLs for form instruction endpoint
ENV_FORM_INSTRUCTION_URL_MAP = {
    "local": "http://localhost:8080/alpha/forms/{}/form_instructions/{}",
    "dev": "https://api.dev.simpler.grants.gov/alpha/forms/{}/form_instructions/{}",
    "staging": "https://api.staging.simpler.grants.gov/alpha/forms/{}/form_instructions/{}",
    "training": "https://api.training.simpler.grants.gov/alpha/forms/{}/form_instructions/{}",
    "prod": "https://api.simpler.grants.gov/alpha/forms/{}/form_instructions/{}",
}


class FormTaskConfig(PydanticBaseEnvConfig):
    form_x_api_key_id: str


class BaseFormTask(abc.ABC):
    def __init__(self) -> None:
        self.config = FormTaskConfig()
        init_form_registry()

    def build_headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Key": self.config.form_x_api_key_id,
        }

    def build_file_upload_headers(self) -> dict:
        """Build headers for file upload requests (multipart/form-data).

        Note: Content-Type is not set here because requests will automatically
        set the correct Content-Type with boundary for multipart/form-data.
        """
        return {
            "Accept": "application/json",
            "X-API-Key": self.config.form_x_api_key_id,
        }

    def get_forms(self) -> list[Form]:
        """Utility function to get active forms in derived classes"""
        return get_active_forms()

    def run(self) -> None:
        self.run_task()

    @abc.abstractmethod
    def run_task(self) -> None:
        pass


def get_form_instruction_url(environment: str, form_id: str, form_instruction_id: str) -> str:
    base_url = ENV_FORM_INSTRUCTION_URL_MAP[environment]
    return base_url.format(form_id, form_instruction_id)
