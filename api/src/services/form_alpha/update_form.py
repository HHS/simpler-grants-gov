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

    # Validate form_instruction_id if provided
    form_instruction_id = form_data.get("form_instruction_id")
    if form_instruction_id is not None:
        form_instruction = db_session.scalar(
            select(FormInstruction).where(
                FormInstruction.form_instruction_id == form_instruction_id
            )
        )
        if form_instruction is None:
            raise_flask_error(404, f"Form instruction with ID {form_instruction_id} not found")

    if existing_form:
        # Update existing form
        logger.info("Updating existing form", extra={"form_id": form_id})
        existing_form.form_name = form_data["form_name"]
        existing_form.form_version = form_data["form_version"]
        existing_form.agency_code = form_data["agency_code"]
        existing_form.omb_number = form_data.get("omb_number")
        existing_form.form_json_schema = form_data["form_json_schema"]
        existing_form.form_ui_schema = form_data["form_ui_schema"]
        existing_form.form_instruction_id = form_instruction_id
        existing_form.form_rule_schema = form_data.get("form_rule_schema")

        # Return the updated form with eagerly loaded relationships
        return existing_form
    else:
        # Create new form
        logger.info("Creating new form", extra={"form_id": form_id})
        new_form = Form(
            form_id=form_id,
            form_name=form_data["form_name"],
            form_version=form_data["form_version"],
            agency_code=form_data["agency_code"],
            omb_number=form_data.get("omb_number"),
            form_json_schema=form_data["form_json_schema"],
            form_ui_schema=form_data["form_ui_schema"],
            form_instruction_id=form_instruction_id,
            form_rule_schema=form_data.get("form_rule_schema"),
        )
        db_session.add(new_form)
        db_session.flush()  # Flush to get the ID assigned

        # Re-fetch with relationships loaded
        form_with_relationships = db_session.scalar(
            select(Form).options(selectinload(Form.form_instruction)).where(Form.form_id == form_id)
        )

        # This should never be None since we just created it, but handle it to satisfy mypy
        if form_with_relationships is None:
            raise_flask_error(500, "Failed to create form")

        return form_with_relationships
