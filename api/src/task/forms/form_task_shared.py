import abc
import logging

from src.db.models.competition_models import Form
from src.form_schema.forms import get_active_forms
from src.form_schema.jsonschema_resolver import resolve_jsonschema
from src.form_schema.jsonschema_validator import validate_json_schema
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

# URLs for each environment
ENV_URL_MAP = {
    "local": "http://localhost:8080/alpha/forms/{}",
    "dev": "https://api.dev.simpler.grants.gov/alpha/forms/{}",
    "staging": "https://api.staging.simpler.grants.gov/alpha/forms/{}",
    "training": "https://api.training.simpler.grants.gov/alpha/forms/{}",
    "prod": "https://api.simpler.grants.gov/alpha/forms/{}",
}

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


def build_form_json(form: Form) -> dict:
    form_instruction_id = str(form.form_instruction_id) if form.form_instruction_id else None

    resolved_jsonschema = resolve_jsonschema(form.form_json_schema)
    # As a sanity test, we run our JSON schema validator logic, if this
    # were invalid JSON schema this would error when called.
    validate_json_schema({}, resolved_jsonschema)

    return {
        "agency_code": form.agency_code,
        "form_instruction_id": form_instruction_id,
        "form_json_schema": resolved_jsonschema,
        "form_name": form.form_name,
        "form_rule_schema": form.form_rule_schema,
        "form_ui_schema": form.form_ui_schema,
        "form_version": form.form_version,
        "json_to_xml_schema": form.json_to_xml_schema,
        "legacy_form_id": form.legacy_form_id,
        "omb_number": form.omb_number,
        "short_form_name": form.short_form_name,
        "form_type": form.form_type,
        "sgg_version": form.sgg_version,
        "is_deprecated": form.is_deprecated,
    }


def get_form_url(environment: str, form_id: str) -> str:
    base_url = ENV_URL_MAP[environment]
    return base_url.format(form_id)


def get_form_instruction_url(environment: str, form_id: str, form_instruction_id: str) -> str:
    base_url = ENV_FORM_INSTRUCTION_URL_MAP[environment]
    return base_url.format(form_id, form_instruction_id)
