#!/usr/bin/env python3
import json
import sys

import click

from src import logging
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

    with logging.init("dat_to_jsonschema_cli"):
        try:
            result = parse_xls_to_schema(
                file_path=input_file,
                sheet_index=sheet,
                skip_rows=skip_rows,
            )

            print(json.dumps(result, indent=4, separators=(",", ": ")))
            return 0

        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            return 1
