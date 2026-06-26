import uuid

import grants_shared.adapters.db as db
from grants_shared.api.route_utils import raise_flask_error

from src.db.models.competition_models import Form, FormInstruction
from src.form_schema.registry.form_template_registry import FormTemplateKey, form_template_registry


def get_form(db_session: db.Session, form_id: uuid.UUID) -> Form:
    """
    Get a form by ID from the in-memory registry.
    If the form has a form_instruction_id, fetch the FormInstruction from the DB.
    """

    try:
        form = form_template_registry.get_by_id_and_major_version(FormTemplateKey(form_id, 1))
    except ValueError:
        raise_flask_error(404, message=f"Could not find Form with ID {form_id}")

    if form.form_instruction_id is not None:
        form.form_instruction = db_session.get(FormInstruction, form.form_instruction_id)
    else:
        form.form_instruction = None

    return form
