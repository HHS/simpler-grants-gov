import logging
from abc import ABC

import src.adapters.db as db
from src.db.models.competition_models import Form
from src.task.task import Task
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


class FormTaskConfig(PydanticBaseEnvConfig):
    # This is the legacy API key approach
    non_local_api_auth_token: str | None = None
    # This is the new API key approach
    form_x_api_key_id: str | None = None


class BaseFormTask(Task, ABC):
    def __init__(self, db_session: db.Session):
        super().__init__(db_session)

        self.config = FormTaskConfig()
        if self.config.non_local_api_auth_token is None and self.config.form_x_api_key_id is None:
            raise Exception(
                "Please set either the NON_LOCAL_API_AUTH_TOKEN or FORM_X_API_KEY_ID environment variable for the environment you wish to call"
            )

    def build_headers(self) -> dict:

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # We may pass both headers, X-API-Key takes precedence
        # in the auth logic
        if self.config.form_x_api_key_id is not None:
            headers["X-API-Key"] = self.config.form_x_api_key_id
        if self.config.non_local_api_auth_token is not None:
            headers["X-Auth"] = self.config.non_local_api_auth_token

        return headers


def build_form_json(form: Form) -> dict:
    form_instruction_id = str(form.form_instruction_id) if form.form_instruction_id else None
    form_type = form.form_type.value if form.form_type else None
    return {
        "agency_code": form.agency_code,
        "form_instruction_id": form_instruction_id,
        "form_json_schema": form.form_json_schema,
        "form_name": form.form_name,
        "form_rule_schema": form.form_rule_schema,
        "form_ui_schema": form.form_ui_schema,
        "form_version": form.form_version,
        "json_to_xml_schema": form.json_to_xml_schema,
        "legacy_form_id": form.legacy_form_id,
        "omb_number": form.omb_number,
        "short_form_name": form.short_form_name,
        "form_type": form_type,
        "sgg_version": form.sgg_version,
        "is_deprecated": form.is_deprecated,
    }


def get_form_url(environment: str, form_id: str) -> str:
    base_url = ENV_URL_MAP[environment]
    return base_url.format(form_id)
