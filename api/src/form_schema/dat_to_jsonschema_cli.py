#!/usr/bin/env python3
import json
import logging

import click

from src import logging as src_logging
from src.form_schema.dat_to_jsonschema import parse_xls_to_schema


@click.command()
@click.argument("input_file", type=click.Path(exists=True, readable=True, path_type=str))
@click.option(
    "-s",
    "--sheet",
    help="Sheet index to extract (0-based, default is 1 for second sheet)",
    type=int,
    default=1,
    show_default=True,
)
@click.option(
    "-r",
    "--skip-rows",
    help="Number of rows to skip from the top of the sheet (default is 2)",
    type=int,
    default=2,
    show_default=True,
)
def main(input_file: str, sheet: int, skip_rows: int) -> int:
    """Main entry point for the script."""

    with src_logging.init("dat_to_jsonschema_cli"):
        logger = logging.getLogger(__name__)
        try:
            result = parse_xls_to_schema(
                file_path=input_file,
                sheet_index=sheet,
                skip_rows=skip_rows,
            )

            print(json.dumps(result, indent=4, separators=(",", ": ")))
            return 0

        except Exception:
            logger.exception("Process failed")
            raise
