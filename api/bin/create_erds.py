# Generate database schema diagrams from our SQLAlchemy models
import logging
import pathlib
from typing import Any

from sqlalchemy_schemadisplay import create_uml_graph

import src.db.models.staging.forecast as staging_forecast_models
import src.db.models.staging.opportunity as staging_opportunity_models
import src.db.models.staging.synopsis as staging_synopsis_models
import src.logging
from src.db.models import agency_models, opportunity_models
from src.db.models.transfer import topportunity_models

logger = logging.getLogger(__name__)

# Construct the path to the folder this file is within
# This gets an absolute path so that where you run the script from won't matter
# and should always resolve to the app/erds folder
ERD_FOLDER = pathlib.Path(__file__).parent.resolve()

# If we want to generate separate files for more specific groups, we can set that up here
API_MODULES = (
    opportunity_models,
    agency_models,
)
STAGING_TABLE_MODULES = (
    staging_opportunity_models,
    staging_forecast_models,
    staging_synopsis_models,
)
TRANSFER_TABLE_MODULES = (topportunity_models,)

# Any modules you add above, merge together for the full schema to be generated
ALL_MODULES = API_MODULES + STAGING_TABLE_MODULES + TRANSFER_TABLE_MODULES


def create_erds(modules: Any, file_name: str) -> None:
    logger.info("Generating ERD diagrams for %s", file_name)

    items = []
    all_mappers = []

    for module in modules:
        items.extend([getattr(module, attr) for attr in dir(module) if attr[0] != "_"])

    for item in items:  # get mapped classes
        try:
            all_mappers.extend([cls for cls in item.registry.mappers])
        except AttributeError as e:
            # import pdb; pdb.set_trace()
            # not a mapper
            logger.error(f"Not a mapped object: {e}")
            pass

    graph = create_uml_graph(all_mappers, show_operations=False, show_multiplicity_one=False)

    png_file_path = ERD_FOLDER / f"{file_name}.png"
    graph.write_png(png_file_path)


def main() -> None:
    with src.logging.init(__package__):
        logger.info("Generating ERD diagrams")

        create_erds(ALL_MODULES, "full-schema")
        create_erds(API_MODULES, "api-schema")
        create_erds(STAGING_TABLE_MODULES, "staging-schema")
        create_erds(TRANSFER_TABLE_MODULES, "transfer-schema")
