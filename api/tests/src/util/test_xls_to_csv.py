from io import StringIO
from unittest.mock import patch

import pandas as pd
import pytest

from src.util.xls_to_csv import xls_to_csv


def test_xls_to_csv_raises_file_not_found(tmp_path):
    missing = tmp_path / "missing.xlsx"
    with pytest.raises(FileNotFoundError):
        xls_to_csv(str(missing))


def test_xls_to_csv_converts_valid_file(tmp_path):
    # Create the path so the os.path.exists guard passes; openpyxl isn't installed
    # in CI, so we mock pandas.read_excel rather than writing a real workbook.
    xls_path = tmp_path / "fixture.xlsx"
    xls_path.touch()

    fake_df = pd.DataFrame({"name": ["alpha", "beta"], "value": [10, 20]})
    with patch("src.util.xls_to_csv.pd.read_excel", return_value=fake_df) as m:
        csv_content = xls_to_csv(str(xls_path), sheet_index=1, skip_rows=0)

    assert m.call_count == 1
    args, kwargs = m.call_args
    assert kwargs["sheet_name"] == 1
    assert kwargs["skiprows"] == 0

    parsed = pd.read_csv(StringIO(csv_content))
    assert list(parsed.columns) == ["name", "value"]
    assert parsed["name"].tolist() == ["alpha", "beta"]
    assert parsed["value"].tolist() == [10, 20]


def test_xls_to_csv_respects_skip_rows(tmp_path):
    xls_path = tmp_path / "fixture.xlsx"
    xls_path.touch()

    fake_df = pd.DataFrame(
        {
            "header_a": ["row_1_a", "row_2_a"],
            "header_b": ["row_1_b", "row_2_b"],
        }
    )
    with patch("src.util.xls_to_csv.pd.read_excel", return_value=fake_df) as m:
        csv_content = xls_to_csv(str(xls_path), sheet_index=1, skip_rows=2)

    args, kwargs = m.call_args
    assert kwargs["skiprows"] == 2

    parsed = pd.read_csv(StringIO(csv_content))
    assert list(parsed.columns) == ["header_a", "header_b"]
    assert parsed["header_a"].tolist() == ["row_1_a", "row_2_a"]
    assert parsed["header_b"].tolist() == ["row_1_b", "row_2_b"]


def test_xls_to_csv_wraps_pandas_errors(tmp_path):
    xls_path = tmp_path / "fixture.xlsx"
    xls_path.touch()

    with patch(
        "src.util.xls_to_csv.pd.read_excel",
        side_effect=ValueError("boom"),
    ):
        with pytest.raises(RuntimeError, match="Error converting Excel to CSV: boom"):
            xls_to_csv(str(xls_path))
