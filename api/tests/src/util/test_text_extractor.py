import pytest

from src.util.text_extractor import (
    TextExtractor,
    UnsupportedTextExtractorFileType,
    extract_text_from_file,
)

TEST_FILE_DIR = "/text_extractor_test_files"


def test_text_extractor_errors_on_invalid_file_type() -> None:
    with pytest.raises(UnsupportedTextExtractorFileType):
        TextExtractor("/pathtounsupported/filetype.movie")


def test_extract_text_from_file_returns_none_unsupported_file_type() -> None:
    assert extract_text_from_file("unsopported_file_type.not_today") is None


@pytest.mark.parametrize(
    "fixture_file_path_val,expected",
    [
        (f"{TEST_FILE_DIR}/docx_data.docx", "Docx data"),
        (f"{TEST_FILE_DIR}/pdf_data.pdf", "pdf data"),
        (f"{TEST_FILE_DIR}/text_data.txt", "text data"),
        (f"{TEST_FILE_DIR}/html_data.html", "header 1\nparagraph\ndiv p\nClick\nhere"),
        (f"{TEST_FILE_DIR}/htm_data.htm", "header 1\nparagraph\ndiv p\nClick\nhere"),
    ],
)
def test_extract_pdf_text(fixture_file_path, fixture_file_path_val, expected) -> None:
    fixture_file_path = fixture_file_path(fixture_file_path_val)
    given = extract_text_from_file(fixture_file_path)
    assert given == expected
