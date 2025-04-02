import io
import logging
import os

import pandas as pd

logger = logging.getLogger(__name__)


def xls_to_csv(xls_file_path: str, sheet_index: int = 1, skip_rows: int = 2) -> str:
    """
    Extract a sheet from an XLS/XLSX file, skip specified number of rows, and save as CSV.

    Args:
        xls_file_path: Path to the Excel file
        output_csv_path: Path where to save the CSV file (if None, return the CSV as a string)
        sheet_index: Index of the sheet to extract (0-based, default is 1 for second sheet)
        skip_rows: Number of rows to skip from the top (default is 2)

    Returns:
        Path to the created CSV file
    """
    if not os.path.exists(xls_file_path):
        raise FileNotFoundError(f"Excel file not found: {xls_file_path}")

    try:
        # Read the specified sheet, skipping the specified number of rows
        df = pd.read_excel(xls_file_path, sheet_name=sheet_index, skiprows=skip_rows)

        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        csv_content = csv_buffer.getvalue()
        logger.info(f"Successfully converted sheet {sheet_index + 1} to CSV string")
        return csv_content

    except Exception as e:
        logger.error(f"Error converting Excel to CSV: {str(e)}")
        raise RuntimeError(f"Error converting Excel to CSV: {str(e)}") from e
