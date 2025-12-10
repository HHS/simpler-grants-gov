import logging
import os

import click
import requests

from src.task.ecs_background_task import ecs_background_task
from src.task.forms.form_task_shared import BaseFormTask, get_form_instruction_url
from src.task.task_blueprint import task_blueprint
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


@task_blueprint.cli.command(
    "update-form-instruction",
    help="Upload or update a form instruction file in a given environment",
)
@click.option(
    "--environment",
    required=True,
    type=click.Choice(["local", "dev", "staging", "training", "prod"]),
)
@click.option("--form-id", required=True, type=str, help="The ID of the form")
@click.option(
    "--form-instruction-id", required=True, type=str, help="The ID of the form instruction"
)
@click.option("--file-path", required=True, type=str, help="Path to the instruction file to upload")
@ecs_background_task(task_name="update-form-instruction")
def update_form_instruction(
    environment: str,
    form_id: str,
    form_instruction_id: str,
    file_path: str,
) -> None:
    # This script is only meant for running locally at this time
    error_if_not_local()
    UpdateFormInstructionTask(
        environment=environment,
        form_id=form_id,
        form_instruction_id=form_instruction_id,
        file_path=file_path,
    ).run()


class UpdateFormInstructionTask(BaseFormTask):

    def __init__(
        self, environment: str, form_id: str, form_instruction_id: str, file_path: str
    ) -> None:
        super().__init__()
        self.environment = environment
        self.form_id = form_id
        self.form_instruction_id = form_instruction_id
        self.file_path = file_path

    def run_task(self) -> None:
        logger.info(
            "Processing form instruction for upload",
            extra={
                "form_id": self.form_id,
                "form_instruction_id": self.form_instruction_id,
                "file_path": self.file_path,
            },
        )

        # Validate file exists
        if not os.path.isfile(self.file_path):
            raise Exception(f"File not found: {self.file_path}")

        headers = self.build_file_upload_headers()
        url = get_form_instruction_url(self.environment, self.form_id, self.form_instruction_id)

        logger.info(f"Uploading form instruction to {url}")

        # Open the file and send as multipart/form-data
        with open(self.file_path, "rb") as f:
            file_name = os.path.basename(self.file_path)
            files = {"file": (file_name, f)}
            resp = requests.put(url, headers=headers, files=files, timeout=30)

        if resp.status_code != 200:
            logger.error(f"Failed to upload form instruction: {resp.text}")
            raise Exception(resp.text)

        logger.info("Message received from endpoint: " + resp.json().get("message", ""))
        logger.info(
            f"Successfully uploaded form instruction {self.form_instruction_id} "
            f"for form {self.form_id} in {self.environment} environment"
        )
