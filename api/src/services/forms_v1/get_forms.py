import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.db.models.competition_models import Form
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def get_all_forms(db_session: db.Session, user: User) -> list[Form]:
    """
    Get all forms associated with the SGG agency code.
    """

    agency_code = "SGG"
    stmt = (
        select(Form)
        .where(Form.agency_code == agency_code)
        .options(selectinload(Form.form_instruction))
        .order_by(Form.created_at.desc())
    )

    forms = db_session.execute(stmt).scalars().all()

    logger.info(
        "Retrieved forms for agency",
        extra={"agency_code": agency_code, "form_count": len(forms), "user_id": user.user_id},
    )

    return list(forms)
