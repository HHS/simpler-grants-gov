import logging
from dataclasses import dataclass

import click
import requests
from sqlalchemy import select

import src.adapters.db as db
from src.adapters.db import flask_db
from src.db.models.competition_models import Form
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.env_config import PydanticBaseEnvConfig
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)

# URLs for each environment
ENV_URL_MAP = {
    "local": "http://localhost:8080/alpha/forms/{}",
    "dev": "https://api.dev.simpler.grants.gov/alpha/forms/{}",
    "staging": "https://api.staging.simpler.grants.gov/alpha/forms/{}",
    "prod": "https://api.simpler.grants.gov/alpha/forms/{}",
}


@dataclass
class UpdateFormContainer:
    environment: str
    form_id: str
    form_instruction_id: str | None
    is_dry_run: bool


class UpdateFormTaskConfig(PydanticBaseEnvConfig):
    non_local_api_auth_token: str | None = None


@task_blueprint.cli.command(
    "update-form",
    help="Update a form in a given environment",
)
@click.option(
    "--environment", required=True, type=click.Choice(["local", "dev", "staging", "prod"])
)
@click.option("--form-id", required=True, type=str)
@click.option("--form-instruction-id", type=str, default=None)
@click.option("--dry-run/--no-dry-run", default=True)
@flask_db.with_db_session()
@ecs_background_task(task_name="update-form")
def update_form(
    db_session: db.Session,
    environment: str,
    form_id: str,
    form_instruction_id: str | None,
    dry_run: bool,
) -> None:
    # This script is only meant for running locally at this time
    error_if_not_local()

    update_form_container = UpdateFormContainer(
        environment=environment,
        form_id=form_id,
        form_instruction_id=form_instruction_id,
        is_dry_run=dry_run,
    )
    UpdateFormTask(db_session, update_form_container).run()


class UpdateFormTask(Task):

    def __init__(self, db_session: db.Session, update_form_container: UpdateFormContainer):
        super().__init__(db_session)
        self.update_form_container = update_form_container

        self.config = UpdateFormTaskConfig()
        if self.config.non_local_api_auth_token is None:
            raise Exception(
                "Please set the NON_LOCAL_API_AUTH_TOKEN environment variable for the environment you wish to call"
            )

    def run_task(self) -> None:
        logger.info("Fetching form from local database")
        form = self.db_session.execute(
            select(Form).where(Form.form_id == self.update_form_container.form_id)
        ).scalar_one_or_none()

        if form is None:
            raise Exception(
                f"No form found with ID {self.update_form_container.form_id} - have you seeded your local DB?"
            )

        request = self.build_request(form)
        headers = self.build_headers()
        url = self.get_url()

        if self.update_form_container.is_dry_run:
            logger.info(f"DRY RUN - NOT SENDING REQUEST TO {url}")
            logger.info(
                f"DRY RUN - WOULD HAVE UPDATED FORM {form.form_id} | {form.short_form_name}"
            )
            return

        logger.info(f"Calling {url}")
        resp = requests.put(url, headers=headers, json=request)

        if resp.status_code != 200:
            logger.error(f"Failed to update form: {resp.text}")
            raise Exception(resp.text)

        logger.info("Message received from endpoint: " + resp.json().get("message", None))
        logger.info(
            f"Successfully updated form {form.form_id} | {form.short_form_name} in {self.update_form_container.environment} environment"
        )

    def build_request(self, form: Form) -> dict:
        return {
            "agency_code": form.agency_code,
            "form_instruction_id": self.update_form_container.form_instruction_id,
            "form_json_schema": form.form_json_schema,
            "form_name": form.form_name,
            "form_rule_schema": form.form_rule_schema,
            "form_ui_schema": form.form_ui_schema,
            "form_version": form.form_version,
            "legacy_form_id": form.legacy_form_id,
            "omb_number": form.omb_number,
            "short_form_name": form.short_form_name,
        }

    def build_headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Auth": self.config.non_local_api_auth_token,
        }

    def get_url(self) -> str:
        base_url = ENV_URL_MAP[self.update_form_container.environment]
        return base_url.format(self.update_form_container.form_id)
