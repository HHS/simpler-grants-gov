import logging

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


@task_blueprint.cli.command(
    "update-form",
    help="Update a form in a given environment",
)
@click.option(
    "--environment", required=True, type=click.Choice(["local", "dev", "staging", "prod"])
)
@click.option("--form-id", required=True, type=str)
@flask_db.with_db_session()
@ecs_background_task(task_name="update-form")
def update_form(
    db_session: db.Session,
    environment: str,
    form_id: str,
) -> None:
    # This script is only meant for running locally at this time
    error_if_not_local()
    UpdateFormTask(db_session, environment=environment, form_id=form_id).run()


class UpdateFormTask(BaseFormTask):

    def __init__(self, db_session: db.Session, environment: str, form_id: str) -> None:
        super().__init__(db_session)
        self.environment = environment
        self.form_id = form_id

    def run_task(self) -> None:
        logger.info("Fetching form from local database")
        form = self.db_session.execute(
            select(Form).where(Form.form_id == self.form_id)
        ).scalar_one_or_none()

        if form is None:
            raise Exception(
                f"No form found with ID {self.form_id} - have you seeded your local DB?"
            )

        request = build_form_json(form)
        headers = self.build_headers()
        url = get_form_url(self.environment, self.form_id)

        logger.info(f"Calling {url}")
        resp = requests.put(url, headers=headers, json=request, timeout=5)

        if resp.status_code != 200:
            logger.error(f"Failed to update form: {resp.text}")
            raise Exception(resp.text)

        logger.info("Message received from endpoint: " + resp.json().get("message", None))
        logger.info(
            f"Successfully updated form {form.form_id} | {form.short_form_name} in {self.environment} environment"
        )
