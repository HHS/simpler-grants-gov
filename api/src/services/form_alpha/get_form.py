import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Form


def get_form(db_session: db.Session, form_id: uuid.UUID) -> Form:
    """
    Get a form by ID and add a download path to the form instruction if present.
    """
    form: Form | None = db_session.execute(
        select(Form).where(Form.form_id == form_id).options(selectinload(Form.form_instruction))
    ).scalar_one_or_none()

    if form is None:
        raise_flask_error(404, message=f"Could not find Form with ID {form_id}")

    return form
