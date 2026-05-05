from io import StringIO

import pandas as pd
import pytest

from src.util.xls_to_csv import xls_to_csv


def _write_workbook(path, sheets):
    """Write each sheet's DataFrame as raw rows (no auto-generated header).

    The header row, if any, is just the first DataFrame row. This keeps the
    row indices intuitive for `skip_rows` assertions.
    """
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        for sheet_name, df in sheets.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False, header=False)


def test_xls_to_csv_raises_file_not_found(tmp_path):
    missing = tmp_path / "missing.xlsx"
    with pytest.raises(FileNotFoundError):
        xls_to_csv(str(missing))


def test_xls_to_csv_converts_valid_file(tmp_path):
    xls_path = tmp_path / "fixture.xlsx"
    sheet_1 = pd.DataFrame([["col_a", "col_b"], [1, "x"], [2, "y"]])
    sheet_2 = pd.DataFrame([["name", "value"], ["alpha", 10], ["beta", 20]])
    _write_workbook(xls_path, {"first": sheet_1, "second": sheet_2})

    csv_content = xls_to_csv(str(xls_path), sheet_index=1, skip_rows=0)

    parsed = pd.read_csv(StringIO(csv_content))
    assert list(parsed.columns) == ["name", "value"]
    assert parsed["name"].tolist() == ["alpha", "beta"]
    assert parsed["value"].tolist() == [10, 20]


def test_xls_to_csv_respects_skip_rows(tmp_path):
    xls_path = tmp_path / "fixture.xlsx"
    sheet_1 = pd.DataFrame({"a": [0]})
    # The data has two leading rows that should be dropped before the header.
    sheet_2 = pd.DataFrame(
        [
            ["preamble", "ignored"],
            ["another", "junk"],
            ["header_a", "header_b"],
            ["row_1_a", "row_1_b"],
            ["row_2_a", "row_2_b"],
        ]
    )
    _write_workbook(xls_path, {"first": sheet_1, "second": sheet_2})

    csv_content = xls_to_csv(str(xls_path), sheet_index=1, skip_rows=2)

    parsed = pd.read_csv(StringIO(csv_content))
    assert list(parsed.columns) == ["header_a", "header_b"]
    assert parsed["header_a"].tolist() == ["row_1_a", "row_2_a"]
    assert parsed["header_b"].tolist() == ["row_1_b", "row_2_b"]
