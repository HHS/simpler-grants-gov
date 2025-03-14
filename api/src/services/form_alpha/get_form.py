from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Form
import src.adapters.db as db
import uuid
from sqlalchemy import select


def get_form(db_session: db.Session, form_id: uuid.UUID) -> Form:

    form: Form | None = db_session.execute(select(Form).where(Form.form_id == form_id)).scalar_one_or_none()

    if form is None:
        raise_flask_error(404, message=f"Could not find Form with ID {form_id}")

    return form