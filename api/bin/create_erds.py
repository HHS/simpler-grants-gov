# Generate database schema diagrams from our SQLAlchemy models
import logging
import pathlib

from eralchemy import render_er
from sqlalchemy import MetaData

import src.logging
from src.db.models.base import ApiSchemaTable
from src.db.models.staging.staging_base import StagingBase

logger = logging.getLogger(__name__)

# Construct the path to the folder this file is within
# This gets an absolute path so that where you run the script from won't matter
# and should always resolve to the app/erds folder
ERD_FOLDER = pathlib.Path(__file__).parent.resolve()

# If we want to generate separate files for more specific groups, we can set that up here
STAGING_BASE_METADATA = StagingBase.metadata
API_BASE_METADATA = ApiSchemaTable.metadata


def create_erds(metadata: MetaData, file_name: str) -> None:
    logger.info("Generating ERD diagrams for %s", file_name)

    png_file_path = str(ERD_FOLDER / f"{file_name}.png")
    render_er(metadata, png_file_path)


def main() -> None:
    with src.logging.init(__package__):
        logger.info("Generating ERD diagrams")

        create_erds(STAGING_BASE_METADATA, "staging-schema")
        create_erds(API_BASE_METADATA, "api-schema")
