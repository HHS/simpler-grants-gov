import uuid

import grants_shared.adapters.db as db
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Competition, FormInstruction


def get_competition(db_session: db.Session, competition_id: uuid.UUID) -> Competition:

    competition: Competition | None = db_session.execute(
        select(Competition)
        .where(Competition.competition_id == competition_id)
        # Fetch the competition forms + actual form objects in the query
        # We don't do "*" here as this endpoint doesn't need to fetch things
        # like the opportunity or applications
        .options(
            selectinload(Competition.competition_forms),
            # Grab the assistance listing object
            selectinload(Competition.opportunity_assistance_listing),
            # Grab who can apply to the application
            selectinload(Competition.link_competition_open_to_applicant),
            # Grab the competition instructions
            selectinload(Competition.competition_instructions),
        )
        .options()
    ).scalar_one_or_none()

    if competition is None:
        raise_flask_error(404, message=f"Could not find Competition with ID {competition_id}")

    # Load form_instruction for each competition form.
    # CompetitionForm.form is a registry-backed @property with no DB session,
    # so form_instruction cannot be selectinloaded through it.
    forms_needing_instruction = {
        cf.form.form_instruction_id: cf.form
        for cf in competition.competition_forms
        if cf.form.form_instruction_id is not None
    }
    if forms_needing_instruction:
        instructions = (
            db_session.execute(
                select(FormInstruction).where(
                    FormInstruction.form_instruction_id.in_(forms_needing_instruction.keys())
                )
            )
            .scalars()
            .all()
        )
        for instruction in instructions:
            # Store as a plain dict so no SQLAlchemy session binding is held on the
            # long-lived registry Form singleton. download_path is computed here while
            # the session is open (it reads file_location under the hood).
            forms_needing_instruction[instruction.form_instruction_id].form_instruction = {
                "form_instruction_id": instruction.form_instruction_id,
                "file_name": instruction.file_name,
                "download_path": instruction.download_path,
                "created_at": instruction.created_at,
                "updated_at": instruction.updated_at,
            }

    return competition
