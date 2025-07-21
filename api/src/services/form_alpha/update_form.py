import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Form, FormInstruction

logger = logging.getLogger(__name__)


def update_form(db_session: db.Session, form_id: uuid.UUID, form_data: dict) -> Form:
    """
    Update or create a form in the database (upsert operation).

    Args:
        db_session: Database session
        form_id: UUID of the form to update or create
        form_data: Dictionary containing form fields to update

    Returns:
        Form: The updated or created form object

    Raises:
        Flask error with appropriate status code if validation fails
    """
    logger.info("Updating form", extra={"form_id": form_id})

    # Check if form exists
    existing_form = db_session.scalar(
        select(Form).options(selectinload(Form.form_instruction)).where(Form.form_id == form_id)
    )

    # Validate form_instruction_id if provided and get the form_instruction object
    form_instruction = None
    form_instruction_id = form_data.get("form_instruction_id")
    if form_instruction_id is not None:
        form_instruction = db_session.scalar(
            select(FormInstruction).where(
                FormInstruction.form_instruction_id == form_instruction_id
            )
        )
        if form_instruction is None:
            raise_flask_error(404, f"Form instruction with ID {form_instruction_id} not found")

    if existing_form is None:
        logger.info("Creating new form", extra={"form_id": form_id})
        form = Form(form_id=form_id)
        db_session.add(form)
    else:
        logger.info("Updating existing form", extra={"form_id": form_id})
        form = existing_form

    # Set all form fields using setattr
    for field, value in form_data.items():
        # Skip form_instruction_id as we handle the relationship separately
        if field != "form_instruction_id":
            setattr(form, field, value)

    # Set the form instruction relationship
    form.form_instruction = form_instruction

    return form
