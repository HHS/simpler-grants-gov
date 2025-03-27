#!/usr/bin/env python3
import argparse
import sys

from src.form_schema.dat_to_jsonschema import parse_xls_to_schema


def parse_args(args: list[str] | None = None) -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Convert Excel (XLS/XLSX) files to CSV format.")

    parser.add_argument("input_file", help="Path to the Excel file to convert")

    parser.add_argument(
        "-s",
        "--sheet",
        help="Sheet index to extract (0-based, default is 1 for second sheet)",
        type=int,
        default=1,
    )

    parser.add_argument(
        "-r",
        "--skip-rows",
        help="Number of rows to skip from the top of the sheet (default is 2)",
        type=int,
        default=2,
    )

    return parser.parse_args(args)


def main(args: list[str] | None = None) -> int:
    """Main entry point for the script."""
    parsed_args = parse_args(args)

    try:
        result = parse_xls_to_schema(
            file_path=parsed_args.input_file,
            sheet_index=parsed_args.sheet,
            skip_rows=parsed_args.skip_rows,
        )

        print(result)
        return 0

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1
