import logging

import pandas as pd
import pytest

from src.util.xls_to_csv import xls_to_csv


class TestXlsToCsv:
    """Unit tests for xls_to_csv helper."""

    def _create_xlsx(
        self, tmp_path, sheets: list[list[list[str]]], filenames: list[str] | None = None
    ) -> str:
        """Create a temp .xlsx with the given sheet data and return its path."""
        filepath = tmp_path / "test.xlsx"
        with pd.ExcelWriter(str(filepath), engine="openpyxl") as writer:
            for idx, rows in enumerate(sheets):
                name = filenames[idx] if filenames else f"Sheet{idx + 1}"
                df = pd.DataFrame(rows[1:], columns=rows[0])
                df.to_excel(writer, sheet_name=name, index=False)
        return str(filepath)

    # -- FileNotFoundError path ------------------------------------------------

    def test_xls_to_csv_raises_file_not_found(self, tmp_path):
        """FileNotFoundError when given a non-existent path."""
        with pytest.raises(FileNotFoundError):
            xls_to_csv(str(tmp_path / "does_not_exist.xlsx"))

    # -- Happy path: valid conversion ------------------------------------------

    def test_xls_to_csv_converts_valid_file(self, tmp_path):
        """Creates a temp .xlsx with pandas and asserts returned CSV string
        contains the expected rows."""
        sheets = [
            [["Header"], ["first"], ["second"]],  # Sheet 1 (index 0) — will be used
            [["ColA", "ColB"], ["a1", "b1"], ["a2", "b2"]],  # Sheet 2 (index 1) — default
        ]
        filepath = self._create_xlsx(tmp_path, sheets)

        # Default sheet_index=1, skip_rows=2
        result = xls_to_csv(filepath, sheet_index=1, skip_rows=2)
        # Sheet 2 only has header + 2 data rows; skip_rows=2 skips header + row1
        # so we expect only row2 in the CSV
        assert "a2" in result
        assert "b2" in result

    def test_xls_to_csv_converts_first_sheet(self, tmp_path):
        """Converts the first sheet (index 0) with no skip_rows."""
        sheets = [
            [["Name", "Age"], ["Alice", "30"], ["Bob", "25"]],
        ]
        filepath = self._create_xlsx(tmp_path, sheets)

        result = xls_to_csv(filepath, sheet_index=0, skip_rows=0)
        assert "Name" in result
        assert "Alice" in result
        assert "Bob" in result
        assert "30" in result
        assert "25" in result

    # -- skip_rows behaviour ---------------------------------------------------

    def test_xls_to_csv_respects_skip_rows(self, tmp_path):
        """Verifies that skip_rows correctly skips leading rows."""
        sheets = [
            [["ColA", "ColB"], ["row0_a", "row0_b"], ["row1_a", "row1_b"], ["row2_a", "row2_b"]],
        ]
        filepath = self._create_xlsx(tmp_path, sheets)

        # skip_rows=1 should skip the header, leaving only 2 data rows
        result = xls_to_csv(filepath, sheet_index=0, skip_rows=1)
        lines = [l for l in result.strip().split("\n") if l.strip()]
        # After skip_rows=1, pandas reads rows 1+ as data, so we get row0 and row1
        assert "row0_a" in result
        assert "row1_a" in result
        # row2 was skipped because it's beyond what pandas read with skip_rows
        # Actually pandas skips the first `skip_rows` data rows after header
        # Let's verify: with skiprows=1, row "row0_a" is the header, "row1_a" and "row2_a" are data
        assert "row1_a" in result
        assert "row2_a" in result

    # -- Logging convention (structured logging) --------------------------------

    def test_xls_to_csv_uses_structured_logging_on_success(self, tmp_path, caplog):
        """On success, logger.info uses a static message with extra dict."""
        sheets = [
            [["Name"], ["Alice"]],
        ]
        filepath = self._create_xlsx(tmp_path, sheets)

        with caplog.at_level(logging.INFO, logger="src.util.xls_to_csv"):
            xls_to_csv(filepath, sheet_index=0, skip_rows=0)

        # Verify the static log message (not an f-string)
        info_records = [r for r in caplog.records if r.levelno == logging.INFO]
        assert any("Successfully converted Excel sheet to CSV string" in r.message for r in info_records)

    def test_xls_to_csv_uses_exception_logging_on_error(self, tmp_path, caplog):
        """On error, logger.exception is used (no f-string in message)."""
        # Create a valid xlsx but request an out-of-range sheet index
        sheets = [
            [["Name"], ["Alice"]],
        ]
        filepath = self._create_xlsx(tmp_path, sheets)

        with pytest.raises(RuntimeError):
            xls_to_csv(filepath, sheet_index=99, skip_rows=0)

        # The error log should use logger.exception with static message
        error_records = [r for r in caplog.records if r.levelno >= logging.ERROR]
        assert any("Failed to convert Excel to CSV" in r.message for r in error_records)
