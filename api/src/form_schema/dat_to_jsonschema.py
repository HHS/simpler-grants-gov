from typing import Any

from src.form_schema.csv_to_jsonschema import csv_to_jsonschema
from src.util.xls_to_csv import xls_to_csv


def parse_xls_to_schema(file_path: str, sheet_index: int = 1, skip_rows: int = 2) -> dict[str, Any]:
    """
    Parse an Excel (.xls/.xlsx) file containing form specifications and convert it to a JSON Schema.

    Args:
        file_path: Path to the Excel file

    Returns:
        A dictionary representing the JSON Schema
    """
    # Read the second sheet of the Excel file (index 1)
    csv_content = xls_to_csv(file_path, sheet_index=sheet_index, skip_rows=skip_rows)

    return csv_to_jsonschema(csv_content)
