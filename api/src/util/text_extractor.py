import logging
from dataclasses import dataclass
from io import BytesIO
from typing import Callable

import pandas
import pptx
from bs4 import BeautifulSoup
from docx import Document
from pypdf import PdfReader
from striprtf.striprtf import rtf_to_text

from src.util.file_util import open_stream

logger = logging.getLogger(__name__)


class UnsupportedTextExtractorFileType(Exception):
    pass


class FileTypeMismatchTextExtractorError(Exception):
    pass


class TextExtractorError(Exception):
    pass


def extract_text_from_file(
    file_path: str, file_type: str | None = None, raise_on_error: bool = False
) -> str | None:
    try:
        return TextExtractor(file_path, file_type=file_type).get_text()
    except Exception as e:
        if raise_on_error:
            logger.error(e)
            raise e
        logger.warning(e)
        return None


def extract_text_from_html(html_string: str) -> str:
    return "\n".join(BeautifulSoup(html_string, "html.parser").stripped_strings)


def extract_text_from_pdf(file_data: bytes) -> str:
    reader = PdfReader(BytesIO(file_data))
    number_of_pages = len(reader.pages)
    text_data = []
    for page_number in range(number_of_pages):
        page = reader.pages[page_number]
        if text := page.extract_text().strip():
            text_data.append(text)
    return "\n".join(text_data)


def extract_text_from_pptx(file_data: bytes) -> str:
    stream = BytesIO(file_data)
    presentation = pptx.Presentation(stream)
    text_runs = []
    for slide in presentation.slides:
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            for paragraph in shape.text_frame.paragraphs:
                for run in paragraph.runs:
                    if text := run.text.strip():
                        text_runs.append(text)
    data = "\n".join(text_runs)
    stream.close()
    return data


def extract_text_from_rft(rtf_data: str) -> str:
    return rtf_to_text(rtf_data)


def extract_text_from_docx(file_data: bytes) -> str:
    return "\n".join(paragraph.text for paragraph in Document(BytesIO(file_data)).paragraphs)


def xls_reader(file_path: str) -> str:
    # Get all rows from every sheet in the xlsx file.
    all_data = {}
    excel_file = pandas.ExcelFile(file_path)
    for sheet_name in excel_file.sheet_names:
        xls_data = pandas.read_excel(excel_file, sheet_name=sheet_name, dtype=str)
        all_data[sheet_name] = xls_data.astype(str).values.tolist()
    return _xls_dict_to_string(all_data)


@dataclass
class TextExtractorConfig:
    extractor: Callable[[bytes | str], str] = lambda data: data
    read_mode: str = "r"
    reader: Callable[[str], bytes | str] | None = None


class TextExtractor:
    def __init__(
        self,
        file_path: str,
        file_type: str | None = None,
    ) -> None:
        self.file_path = file_path
        self.file_type = file_type.lower() if file_type else self.file_path.split(".")[-1].lower()
        self._validate_file_type()
        self.config = TextExtractor.get_configs()[self.file_type]

    def get_text(self) -> str:
        try:
            return self.config.extractor(self._read_file_data()).strip()
        except Exception as e:
            err = f"TextExtractorError: Could not extract text from file {self.file_path} - {self.file_type}: {e}"
            logger.error(err)
            raise TextExtractorError(err)

    @staticmethod
    def get_configs() -> dict:
        html_extractor_config = TextExtractorConfig(extractor=extract_text_from_html)
        xls_extractor_config = TextExtractorConfig(reader=xls_reader)
        return {
            "docx": TextExtractorConfig(extractor=extract_text_from_docx, read_mode="rb"),
            "pdf": TextExtractorConfig(extractor=extract_text_from_pdf, read_mode="rb"),
            "pptx": TextExtractorConfig(extractor=extract_text_from_pptx, read_mode="rb"),
            "txt": TextExtractorConfig(),
            "html": html_extractor_config,
            "htm": html_extractor_config,
            "rtf": TextExtractorConfig(extractor=extract_text_from_rft),
            "xlsm": xls_extractor_config,
            "xlsx": xls_extractor_config,
        }

    def _read_file_data(self) -> bytes | str:
        if self.config.reader:
            return self.config.reader(self.file_path)
        with open_stream(self.file_path, self.config.read_mode) as f:
            return f.read()

    def _validate_file_type(self) -> None:
        if not self.file_path.lower().endswith(self.file_type):
            err = f"Mismatch file type: {self.file_path} must end with {self.file_type}"
            raise FileTypeMismatchTextExtractorError(err)
        if not self.file_type in set(TextExtractor.get_configs().keys()):
            err = f"Unsupported file type: {self.file_type}"
            raise UnsupportedTextExtractorFileType(err)


def _xls_dict_to_string(xls_dict: dict[str, list[list]]) -> str:
    xls_data = []
    for sheet_name, rows in xls_dict.items():
        xls_data.append(sheet_name)
        for row in rows:
            xls_data.append(",".join(str(i) for i in row))
        xls_data.append("")
    return "\n".join(xls_data)
