from typing import Any

from src.form_schema.csv_to_jsonschema import csv_to_jsonschema
from src.util.xls_to_csv import xls_to_csv


def parse_xls_to_schema(
    file_path: str, sheet_index: int = 1, skip_rows: int = 2
) -> tuple[dict[str, Any], list]:
    """
    Parse an Excel (.xls/.xlsx) file containing form specifications and convert it to JSON Schema and UI Schema.

    Args:
        file_path: Path to the Excel file
        sheet_index: Index of the sheet to read (default: 1)
        skip_rows: Number of rows to skip (default: 2)

    Returns:
        A tuple containing:
        - A dictionary representing the JSON Schema
        - A list representing the UI Schema
    """
    # Read the specified sheet of the Excel file
    csv_content = xls_to_csv(file_path, sheet_index=sheet_index, skip_rows=skip_rows)

    return csv_to_jsonschema(csv_content)
