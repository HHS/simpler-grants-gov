import logging
from dataclasses import dataclass

import click
import requests
from sqlalchemy import select

import src.adapters.db as db
from src.adapters.db import flask_db
from src.db.models.competition_models import Form
from src.task.ecs_background_task import ecs_background_task
from src.task.forms.form_task_shared import BaseFormTask, build_form_json, get_form_url
from src.task.task_blueprint import task_blueprint
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


@dataclass
class UpdateFormContainer:
    environment: str
    form_id: str
    form_instruction_id: str | None


@task_blueprint.cli.command(
    "update-form",
    help="Update a form in a given environment",
)
@click.option(
    "--environment", required=True, type=click.Choice(["local", "dev", "staging", "prod"])
)
@click.option("--form-id", required=True, type=str)
@click.option("--form-instruction-id", type=str, default=None)
@flask_db.with_db_session()
@ecs_background_task(task_name="update-form")
def update_form(
    db_session: db.Session,
    environment: str,
    form_id: str,
    form_instruction_id: str | None,
) -> None:
    # This script is only meant for running locally at this time
    error_if_not_local()

    update_form_container = UpdateFormContainer(
        environment=environment,
        form_id=form_id,
        form_instruction_id=form_instruction_id,
    )
    UpdateFormTask(db_session, update_form_container).run()


class UpdateFormTask(BaseFormTask):

    def __init__(self, db_session: db.Session, update_form_container: UpdateFormContainer):
        super().__init__(db_session)
        self.update_form_container = update_form_container

    def run_task(self) -> None:
        logger.info("Fetching form from local database")
        form = self.db_session.execute(
            select(Form).where(Form.form_id == self.update_form_container.form_id)
        ).scalar_one_or_none()

        if form is None:
            raise Exception(
                f"No form found with ID {self.update_form_container.form_id} - have you seeded your local DB?"
            )

        request = build_form_json(form, self.update_form_container.form_instruction_id)
        headers = self.build_headers()
        url = get_form_url(
            self.update_form_container.environment, self.update_form_container.form_id
        )

        logger.info(f"Calling {url}")
        resp = requests.put(url, headers=headers, json=request, timeout=5)

        if resp.status_code != 200:
            logger.error(f"Failed to update form: {resp.text}")
            raise Exception(resp.text)

        logger.info("Message received from endpoint: " + resp.json().get("message", None))
        logger.info(
            f"Successfully updated form {form.form_id} | {form.short_form_name} in {self.update_form_container.environment} environment"
        )
