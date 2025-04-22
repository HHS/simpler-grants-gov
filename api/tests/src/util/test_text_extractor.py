import pytest

from src.util.text_extractor import (
    FileTypeMismatchTextExtractorError,
    TextExtractor,
    UnsupportedTextExtractorFileType,
    extract_text_from_file,
)

TEST_FILE_DIR = "/text_extractor_test_files"


@pytest.mark.parametrize(
    "file_path,file_type,exception",
    [
        ("d.docx", "doc", FileTypeMismatchTextExtractorError),
        ("d.docx", ".doc", FileTypeMismatchTextExtractorError),
        ("d", ".doc", FileTypeMismatchTextExtractorError),
        ("d.app", ".app", UnsupportedTextExtractorFileType),
        ("d.docx", "ocx", UnsupportedTextExtractorFileType),
    ],
)
def test_invalid_text_extractor_args(file_path, file_type, exception) -> None:
    with pytest.raises(exception):
        TextExtractor(file_path=file_path, file_type=file_type)


def test_extract_text_from_file_raises_when_specified_in_param() -> None:
    with pytest.raises(UnsupportedTextExtractorFileType):
        extract_text_from_file("unsupported_file_type.not_today", raise_on_error=True)
    assert extract_text_from_file("unsupported_file_type.not_today", raise_on_error=False) is None


def test_extract_text_from_file_returns_none_unsupported_file_type() -> None:
    assert extract_text_from_file("unsupported_file_type.not_today") is None


def test_extract_text_from_file_char_limit(fixture_file_path) -> None:
    mock_file_path = fixture_file_path(f"{TEST_FILE_DIR}/text_data.txt")
    assert len(extract_text_from_file(mock_file_path, char_limit=1)) == 1
    assert len(extract_text_from_file(mock_file_path)) > 1


@pytest.mark.parametrize(
    "fixture_file_path_val,expected",
    [
        (f"{TEST_FILE_DIR}/docx_data.docx", "Docx data"),
        (f"{TEST_FILE_DIR}/html_data.html", "header 1\nparagraph\ndiv p\nClick\nhere"),
        (f"{TEST_FILE_DIR}/htm_data.htm", "header 1\nparagraph\ndiv p\nClick\nhere"),
        (f"{TEST_FILE_DIR}/pdf_data.pdf", "pdf data"),
        (f"{TEST_FILE_DIR}/pptx_data.pptx", "Presentation Title Text\nSubtitle Text"),
        (f"{TEST_FILE_DIR}/rtf_data.rtf", "rtf title\n\nrtf paragraph"),
        (f"{TEST_FILE_DIR}/text_data.txt", "text data"),
        (
            f"{TEST_FILE_DIR}/xlsx_data.xlsx",
            "sheet1\nh1,h2\nxlsx,data\n\nsheet2\nh3,h4\nandxlsm,data",
        ),
        (
            f"{TEST_FILE_DIR}/xlsm_data.xlsm",
            "sheet1\nh1,h2\nxlsx,data\n\nsheet2\nh3,h4\nandxlsm,data",
        ),
    ],
)
def test_extract_pdf_text(fixture_file_path, fixture_file_path_val, expected) -> None:
    fixture_file_path = fixture_file_path(fixture_file_path_val)
    given = extract_text_from_file(fixture_file_path)
    assert given == expected
