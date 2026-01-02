import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Competition, CompetitionForm, Form

logger = logging.getLogger(__name__)


def update_competition_flag(
    db_session: db.Session, competition_id: str, is_simpler_grants_enabled: bool
) -> Competition:
    comp_uuid = uuid.UUID(competition_id)

    stmt = (
        select(Competition)
        .where(Competition.competition_id == comp_uuid)
        .options(
            # Chained selectinload fetches nested children: Competition -> CompetitionForm -> Form
            # This is required in order to return the competition DB object
            selectinload(Competition.competition_forms)
            .selectinload(CompetitionForm.form)
            .selectinload(Form.form_instruction),
            # Fetch other required top-level relationships
            selectinload(Competition.opportunity_assistance_listing),
            selectinload(Competition.link_competition_open_to_applicant),
            selectinload(Competition.competition_instructions),
        )
    )

    competition = db_session.execute(stmt).scalar_one_or_none()

    if not competition:
        raise_flask_error(404, f"Competition with ID {competition_id} not found.")

    # Apply the change
    competition.is_simpler_grants_enabled = is_simpler_grants_enabled

    logger.info(f"Updated is_simpler_grants_enabled for competition {competition_id}")

    return competition
