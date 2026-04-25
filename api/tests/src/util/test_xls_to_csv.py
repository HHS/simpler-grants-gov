import pandas as pd
import pytest

from src.util.xls_to_csv import xls_to_csv


def test_xls_to_csv_raises_file_not_found():
    """Test that FileNotFoundError is raised for non-existent file."""
    with pytest.raises(FileNotFoundError):
        xls_to_csv("/non/existent/path.xlsx")


def test_xls_to_csv_converts_valid_file(tmp_path):
    """Test converting a valid Excel file to CSV string."""
    excel_file = tmp_path / "test.xlsx"
    df = pd.DataFrame({"col1": [1, 2, 3], "col2": ["a", "b", "c"]})
    df.to_excel(excel_file, index=False, sheet_name="Sheet1")
    
    csv_content = xls_to_csv(str(excel_file), sheet_index=0, skip_rows=0)
    
    assert "col1,col2" in csv_content
    assert "1,a" in csv_content
    assert "2,b" in csv_content
    assert "3,c" in csv_content


def test_xls_to_csv_respects_skip_rows(tmp_path):
    """Test that skip_rows parameter correctly skips leading rows."""
    excel_file = tmp_path / "test.xlsx"
    df = pd.DataFrame({"col1": [1, 2, 3], "col2": ["a", "b", "c"]})
    df.to_excel(excel_file, index=False, sheet_name="Sheet1")
    
    csv_content = xls_to_csv(str(excel_file), sheet_index=0 )
    
    assert "col1,col2" not in csv_content #First two rows are skipped. 
    assert "1,a" not in csv_content 
    assert "2,b" in csv_content
    assert "3,c" in csv_content
