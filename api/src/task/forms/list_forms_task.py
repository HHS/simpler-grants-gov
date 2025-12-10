import datetime
import logging

import click
import requests
from prettytable import PrettyTable

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
    "--environment",
    required=True,
    type=click.Choice(["local", "dev", "staging", "training", "prod"]),
)
@click.option("--verbose", default=False, is_flag=True, help="Show the full diff of forms")
@ecs_background_task(task_name="list-forms")
def list_forms(environment: str, verbose: bool) -> None:
    # This script is only meant for running locally at this time
    error_if_not_local()

    ListFormsTask(environment, verbose).run()


class ListFormsTask(BaseFormTask):

    def __init__(self, environment: str, verbose: bool, print_output: bool = True) -> None:
        super().__init__()
        self.environment = environment
        self.verbose = verbose
        self.print_output = print_output

        self.out_of_date_forms: list[str] = []

        # Setup a pretty table for making a helpful output.
        self.output_table = PrettyTable()
        self.output_table.align = "l"
        self.output_table.field_names = ["Form Name", "Version", "Last Updated", "Changed Fields"]

    def run_task(self) -> None:
        forms = self.get_forms()

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
            out_of_date_entries = [f"# {form_txt}", update_cmd]

            # If the form has a form_instruction_id, also include the command to update the instruction
            if form.form_instruction_id is not None:
                form_instruction_cmd = get_update_form_instruction_cmd(
                    self.environment, form_id, str(form.form_instruction_id)
                )
                out_of_date_entries.append(form_instruction_cmd)
            
            out_of_date_entries.append("\n---")

            self.out_of_date_forms.extend(out_of_date_entries)
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


def get_update_cmd(environment: str, form_id: str) -> str:
    """Build a command for running the update-form script paired with this one"""
    args = f"task update-form --environment={environment} --form-id={form_id}"

    return f'make cmd args="{args}"'


def get_update_form_instruction_cmd(
    environment: str, form_id: str, form_instruction_id: str
) -> str:
    """Build a command for running the update-form-instruction script"""
    args = (
        f"task update-form-instruction --environment={environment} "
        f"--form-id={form_id} --form-instruction-id={form_instruction_id} "
        f"--file-path=<PATH_TO_INSTRUCTION_FILE>"
    )

    return f'make cmd args="{args}"'
