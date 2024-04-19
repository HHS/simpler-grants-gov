import csv
import logging
from typing import cast

import click

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.util.file_util as file_util
from src.constants.schema import Schemas
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)

FILES_TO_LOAD = [
    "opportunity.csv",
    "opportunity_summary.csv",
    "opportunity_assistance_listing.csv",
    "link_opportunity_summary_applicant_type.csv",
    "link_opportunity_summary_funding_instrument.csv",
    "link_opportunity_summary_funding_category.csv",
]


@task_blueprint.cli.command(
    "import-opportunity-csvs",
    help="Load several csv files to the opportunity tables",
)
@click.option("--input-folder", required=True, help="The directory to fetch the input files from")
@flask_db.with_db_session()
def import_opportunity_csvs(db_session: db.Session, input_folder: str) -> None:
    with db_session.begin():
        process(db_session, input_folder, Schemas.API)


def process(db_session: db.Session, input_folder: str, schema: str) -> None:
    for csv_file in FILES_TO_LOAD:
        logger.info("Processing %s", csv_file)
        table_name = csv_file.removesuffix(".csv")
        csv_filepath = file_util.join(input_folder, csv_file)

        load_csv_stream_to_table(db_session, table_name, csv_filepath, schema)


def load_csv_stream_to_table(
    db_session: db.Session, table_name: str, csv_filepath: str, schema: str
) -> None:
    # This is a bit hacky - I need all of the field names of the csv
    # to write the COPY command, so open the file, read a single record
    # so that we have the fieldnames, and then close the file
    field_names: list[str] = []
    with file_util.open_stream(csv_filepath) as csvfile:
        reader = csv.DictReader(csvfile)

        field_names = cast(list[str], reader.fieldnames)

    with file_util.open_stream(csv_filepath) as csvfile:
        # FORCE_NULL(col1, col2..)
        # makes it so empty quotes are treated as nulls
        # this isn't technically right as actual empty-string
        # values will be changed to nulls, but working around that
        # problem requires us to generate the CSVs differently
        # and this is deliberately a pretty quick hacky approach
        cmd = f"COPY {schema}.{table_name}({','.join(field_names)}) from STDIN with (DELIMITER ',', FORMAT CSV, HEADER TRUE, FORCE_NULL({','.join(field_names)}))"
        cursor = db_session.connection().connection.cursor()

        with cursor.copy(cmd) as copy:
            while data := csvfile.read(10000):
                copy.write(data)

        logger.info(cursor.rowcount)
