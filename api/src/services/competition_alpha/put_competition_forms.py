import logging
import uuid

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import Competition, CompetitionForm, Form
from src.db.models.user_models import User
from src.services.competition_alpha.get_competition import get_competition

logger = logging.getLogger(__name__)


def _reconcile_competition_forms(
    db_session: db.Session,
    competition: Competition,
    requested_forms: list[dict],
    forms_by_id: dict[uuid.UUID, Form],
) -> None:
    """
    Reconciles the competition's forms with the requested forms.

    - Updates is_required when a form already exists
    - Adds new CompetitionForm records for new form_ids
    - Removes CompetitionForm records not present in the request
    """

    existing_by_form_id = {cf.form_id: cf for cf in competition.competition_forms}

    target_form_ids: set[uuid.UUID] = set()

    for form_data in requested_forms:
        form_id = form_data["form_id"]
        is_required = form_data["is_required"]

        target_form_ids.add(form_id)

        existing_cf = existing_by_form_id.get(form_id)

        if existing_cf:
            if existing_cf.is_required != is_required:
                existing_cf.is_required = is_required
        else:
            cf = CompetitionForm(
                competition_id=competition.competition_id,
                form_id=form_id,
                is_required=is_required,
            )
            db_session.add(cf)

    # Remove forms not included in the request
    for existing_cf in list(competition.competition_forms):
        if existing_cf.form_id not in target_form_ids:
            competition.competition_forms.remove(existing_cf)


def set_competition_forms(
    db_session: db.Session, user: User, competition_id, json_data: dict
) -> Competition:
    # Check user access
    verify_access(user, {Privilege.MANAGE_COMPETITION}, None)

    competition = get_competition(db_session, competition_id)

    if not competition:
        raise_flask_error(404, f"Competition with ID {competition_id} not found.")

    requested_forms = json_data["forms"]
    requested_form_ids = [f["form_id"] for f in requested_forms]

    # Validate all forms exist
    forms_db = db_session.query(Form).filter(Form.form_id.in_(requested_form_ids)).all()
    if len(forms_db) != len(requested_form_ids):
        raise_flask_error(404, "One or more forms were not found.")

    # Reconcile competition forms (add/update/remove)
    _reconcile_competition_forms(
        db_session,
        competition=competition,
        requested_forms=requested_forms,
        forms_by_id={form.form_id: form for form in forms_db},
    )

    return competition
