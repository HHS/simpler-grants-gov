# Generate database schema diagrams from our SQLAlchemy models
import codecs
import logging
import os
import pathlib
import pdb
from typing import Any

import pydot
import sadisplay

import src.db.models.staging.forecast as staging_forecast_models
import src.db.models.staging.opportunity as staging_opportunity_models
import src.db.models.staging.synopsis as staging_synopsis_models
import src.logging
from src.db.models import agency_models, opportunity_models
from src.db.models.transfer import topportunity_models

from eralchemy import render_er

from sqlalchemy_schemadisplay import create_uml_graph
from sqlalchemy.orm import class_mapper
from sqlalchemy import inspect



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
    import pdb
    items = []
    all_mappers =[]

    for module in modules:
        items.extend([getattr(module, attr) for attr in dir(module) if attr[0] != '_'])

    for item in items: # get mapped classes
        try:
            all_mappers.extend([cls for cls in item.registry.mappers])
        except Exception as e:
            logger.error("sqlalchemy.exc.NoInspectionAvailable")
            pass


    graph = create_uml_graph(all_mappers,
                             show_operations=False,  # not necessary in this case
                             show_multiplicity_one=False  # some people like to see the ones, some don't
                             )

    png_file_path = ERD_FOLDER / f"{file_name}.png"
    graph.write_png(png_file_path)  # write out the file

    # render_er(
    #     items[0],  # List your models here
    #
    #     png_file_path
    # )

    # dot_file_name = ERD_FOLDER / f"{file_name}.dot"
    #
    # # We create a temporary .dot file which we then convert to a png
    # with codecs.open(str(dot_file_name), "w", encoding="utf8") as f:
    #     f.write(sadisplay.dot(description))
    #
    # (graph,) = pydot.graph_from_dot_file(dot_file_name)
    #
    # png_file_path = ERD_FOLDER / f"{file_name}.png"
    # logger.info("Creating ERD diagram at %s", png_file_path)
    # graph.write_png(png_file_path)

   # remove the temporary .dot file
    # os.remove(dot_file_name)


def main() -> None:
    with src.logging.init(__package__):
        logger.info("Generating ERD diagrams")

        create_erds(ALL_MODULES, "full-schema")
        create_erds(API_MODULES, "api-schema")
        create_erds(STAGING_TABLE_MODULES, "staging-schema")
        create_erds(TRANSFER_TABLE_MODULES, "transfer-schema")
