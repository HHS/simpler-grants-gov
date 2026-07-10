# Generate database schema diagrams from our SQLAlchemy models
import logging
import pathlib

import grants_shared.logs
from eralchemy import render_er
from sqlalchemy import MetaData

from src.db.models.grantor_schema_table import GrantorSchemaTable

logger = logging.getLogger(__name__)

# Construct the path to the folder this file is within
# This gets an absolute path so that where you run the script from won't matter
# and should always resolve to the app/erds folder
ERD_FOLDER = pathlib.Path(__file__).parent.resolve()

# If we want to generate separate files for more specific groups, we can set that up here
GRANTOR_BASE_METADATA = GrantorSchemaTable.metadata


def create_erds(metadata: MetaData, file_name: str) -> None:
    logger.info("Generating ERD diagrams for %s", file_name)

    png_file_path = str(ERD_FOLDER / f"{file_name}.png")
    render_er(metadata, png_file_path)


def main() -> None:
    with grants_shared.logs.init(__package__):
        logger.info("Generating ERD diagrams")

        create_erds(GRANTOR_BASE_METADATA, "grantor-schema")
