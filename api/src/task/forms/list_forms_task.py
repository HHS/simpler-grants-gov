import datetime
import logging

import click
import requests
from prettytable import PrettyTable
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
    "list-forms",
    help="List forms in an environment and whether they're up-to-date",
)
@click.option(
    "--environment", required=True, type=click.Choice(["local", "dev", "staging", "prod"])
)
@click.option("--verbose", default=False, is_flag=True, help="Show the full diff of forms")
@flask_db.with_db_session()
@ecs_background_task(task_name="list-forms")
def list_forms(db_session: db.Session, environment: str, verbose: bool) -> None:
    # This script is only meant for running locally at this time
    error_if_not_local()

    ListFormsTask(db_session, environment, verbose).run()


class ListFormsTask(BaseFormTask):

    def __init__(
        self, db_session: db.Session, environment: str, verbose: bool, print_output: bool = True
    ) -> None:
        super().__init__(db_session)
        self.environment = environment
        self.verbose = verbose
        self.print_output = print_output

        self.out_of_date_forms: list[str] = []

        # Setup a pretty table for making a helpful output.
        self.output_table = PrettyTable()
        self.output_table.align = "l"
        self.output_table.field_names = ["Form Name", "Version", "Last Updated", "Changed Fields"]

    def run_task(self) -> None:
        with self.db_session.begin():
            forms = (
                self.db_session.execute(select(Form).order_by(Form.form_name.asc())).scalars().all()
            )
            if len(forms) == 0:
                raise Exception(
                    "No forms found, have you run 'make db-seed-local' to initialize the forms?"
                )

            for form in forms:
                self.process_form(form)

            if self.print_output:
                self.print_outputs()

    def process_form(self, form: Form) -> None:
        """Process a form, collecting information about whether it is up-to-date"""
        form_id = str(form.form_id)
        form_txt = f"{form.form_name} {form.form_version}"  # for output

        # Fetch the form from the given environment
        url = get_form_url(self.environment, form_id)
        env_form = get_form_from_env(url, self.build_headers(), form_id, self.environment)

        if env_form is None:
            logger.warning(f"{form_txt} has not yet been created in environment {self.environment}")
            self.output_table.add_row(
                [form.form_name, form.form_version, "n/a", "ALL"], divider=True
            )

            update_cmd = get_update_cmd(self.environment, form_id)

            # Add a message to the out-of-date forms list so we can make it easier
            # to update those forms by generating the command with some messages for organization
            self.out_of_date_forms.extend(
                [
                    f"# {form_txt}",
                    "# WARNING: If this form has a form_instruction record you'll need to create that"
                    "# and add it to the command below manually.\n",
                    update_cmd,
                ]
            )
            return

        # Make the local form a dict for easier comparison
        local_form = build_form_json(form)

        # Diff the local and non-local forms
        results = diff_form(local_form, env_form)
        changed_fields = ", ".join(results.keys())

        # Add information about the form to a table.
        updated_at = format_timestamp(env_form.get("updated_at"))
        self.output_table.add_row(
            [form.form_name, form.form_version, updated_at, changed_fields], divider=True
        )

        if len(results) > 0:
            logger.warning(f"{form_txt} has the following changed fields: {changed_fields}")
            # If we turn on verbose mode, we will print out all the changes
            # which if the schema fields have changed, will be quite a lot.
            if self.verbose:
                for changed_field, changes in results.items():
                    existing_value = changes.get("existing_value", None)
                    planned_value = changes.get("planned_value", None)

                    logger.warning(
                        f"Field {changed_field} will change from {existing_value} to {planned_value}"
                    )

            update_cmd = get_update_cmd(self.environment, form_id)
            self.out_of_date_forms.extend([f"# {form_txt}\n", update_cmd, "\n---"])

    def print_outputs(self) -> None:
        """Print output values giving helpful info collected during processing.

        NOTE: We print rather than log here because we want to display
              the data formatted in a specific way for readability.
        """
        print(self.output_table.get_string(sortby="Last Updated"))

        if len(self.out_of_date_forms) > 0:
            print("-" * 40)
            print("OUT OF DATE FORMS")
            print("-" * 40)
            for out_of_date in self.out_of_date_forms:
                print(out_of_date)
            print()


def diff_form(planned_put_request: dict, existing_form_data: dict) -> dict[str, dict]:
    """Diff what we plan to send to the Form endpoint with what it already has"""
    changed_fields = {}
    for field, planned_value in planned_put_request.items():
        # The instruction ID isn't returned in the top-level object, but can be found
        # in the form instructions object, so pull it out differently.
        if field == "form_instruction_id":
            existing_value = get_form_instruction_id(existing_form_data)
        else:
            existing_value = existing_form_data.get(field)
        if planned_value != existing_value:
            changed_fields[field] = {
                "existing_value": existing_value,
                "planned_value": planned_value,
            }

    return changed_fields


def format_timestamp(value: str | None) -> str | None:
    """Convert the timestamp format from isoformat to one that is
    slightly more human-readable, removing fractions of a second
    and making the timezone aware.

    For example:
     2025-09-19T19:53:02.220955+00:00
     becomes
     2025-09-19 19:53:02 UTC
    """
    if value is None:
        return None

    timestamp = datetime.datetime.fromisoformat(value)

    return timestamp.strftime("%Y-%m-%d %H:%M:%S %Z")


def get_form_from_env(url: str, headers: dict, form_id: str, environment: str) -> dict | None:
    """Query the GET form endpoint"""
    resp = requests.get(url, headers=headers, timeout=5)

    if resp.status_code == 404:
        logger.info(f"Form {form_id} does not yet exist in {environment}")
        return None

    if resp.status_code != 200:
        raise Exception(f"Failed to fetch existing form from {environment}: {resp.text}")

    existing_form_data = resp.json().get("data", None)
    return existing_form_data


def get_form_instruction_id(form_data: dict) -> str | None:
    # The instruction ID isn't returned in the top-level object, but can be found
    # in the form instructions object, so pull it out differently.
    form_instruction_obj = form_data.get("form_instruction", {})
    if form_instruction_obj is None:
        return None

    return form_instruction_obj.get("form_instruction_id", None)


def get_update_cmd(environment: str, form_id: str) -> str:
    """Build a command for running the update-form script paired with this one"""
    args = f"task update-form --environment={environment} --form-id={form_id}"

    return f'make cmd args="{args}"'
