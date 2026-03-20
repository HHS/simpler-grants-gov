import dataclasses
import logging
import uuid
from decimal import Decimal
from typing import Any

from src.db.models.competition_models import Application
from src.form_schema.forms import ProjectAbstractSummary_v2_0, SF424_v4_0, SF424a_v1_0
from src.services.applications.application_validation import is_form_required
from src.util.decimal_util import convert_monetary_field, quantize_decimal
from src.util.dict_util import get_nested_value

logger = logging.getLogger(__name__)


@dataclasses.dataclass
class FormField:
    form_id: uuid.UUID
    field: str  # field should be defined as a path in the JSON schema of format a.b.c


def get_field_from_application(application: Application, form_fields: list[FormField]) -> Any:
    """
    Function to get a field from an application's forms.

    A list of forms + fields can be passed in and the first non-None value
    will be returned. If no form has the value set, None will be returned.

    Typing is not validated at this level, you should validate the value
    in the calling function.

    Form fields can be a jsonpath (eg. "a.b.c" against {"a": {"b": {"c": 123}}}" will return 123)
    """

    # Setup a mapping of form_id to application form
    # Skipping all application forms that aren't going
    # to be in the submission.
    application_form_map = {}
    for application_form in application.application_forms:
        # If the form is required OR included in the submission then look at its values
        # We don't want to look at a form that isn't going into the submission
        if is_form_required(application_form) or application_form.is_included_in_submission:
            application_form_map[application_form.form_id] = application_form

    # For each of the configured form fields
    # see if that form exists on the application
    # and if it does, fetch the value.
    for form_field in form_fields:
        if form_field.form_id in application_form_map:
            application_form = application_form_map[form_field.form_id]
            value = get_nested_value(
                application_form.application_response, form_field.field.split(".")
            )
            if value is not None:
                return value

    # Nothing was found
    return None


PROJECT_TITLE_FORM_FIELDS = [
    FormField(form_id=SF424_v4_0.form_id, field="project_title"),
    FormField(form_id=ProjectAbstractSummary_v2_0.form_id, field="project_title"),
]


def get_project_title_from_application(application: Application) -> str | None:
    """Get the project title from the application's forms"""
    project_title = get_field_from_application(application, PROJECT_TITLE_FORM_FIELDS)

    if project_title is None:
        return None

    if not isinstance(project_title, str):
        logger.warning(
            "Project title for application is not a string",
            extra={"application_id": application.application_id},
        )
        return None

    return project_title


REQUESTED_AMOUNT_FORM_FIELDS = [
    FormField(form_id=SF424_v4_0.form_id, field="federal_estimated_funding"),
    FormField(
        form_id=SF424a_v1_0.form_id, field="total_budget_summary.federal_new_or_revised_amount"
    ),
]


def get_requested_amount_from_application(application: Application) -> Decimal | None:
    """Get the total requested amount from the application's forms"""
    raw_requested_amount = get_field_from_application(application, REQUESTED_AMOUNT_FORM_FIELDS)

    if raw_requested_amount is None:
        return None

    try:
        return quantize_decimal(convert_monetary_field(raw_requested_amount))
    except ValueError:
        logger.warning(
            "Unable to parse monetary amount on application",
            extra={"application_id": application.application_id},
        )
        return None
