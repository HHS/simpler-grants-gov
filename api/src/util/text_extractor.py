from dataclasses import dataclass
from io import BytesIO
from typing import Callable

from bs4 import BeautifulSoup
from docx import Document
from pypdf import PdfReader
from striprtf.striprtf import rtf_to_text

from src.util.file_util import open_stream

TEXT_EXTRACTOR_SUPPORTED_FILE_TYPES = (
    "txt",
    "pdf",
    "docx",
    "doc",
    "xlsx",
    "xlsm",
    "html",
    "htm",
    "pptx",
    "ppt",
    "rtf",
)


class UnsupportedTextExtractorFileType(Exception):
    pass


def extract_text_from_file(file_path: str, file_type: str | None = None) -> str | None:
    try:
        return TextExtractor(file_path, file_type=file_type).get_text()
    except UnsupportedTextExtractorFileType:
        return None


def extract_text_from_html(html_string: str) -> str:
    return "\n".join(BeautifulSoup(html_string, "html.parser").stripped_strings)


def extract_text_from_pdf(file_data: bytes) -> str:
    reader = PdfReader(BytesIO(file_data))
    number_of_pages = len(reader.pages)
    text_data = []
    for page_number in range(number_of_pages):
        page = reader.pages[page_number]
        text = page.extract_text()
        text_data.append(text)
    return "\n".join(text_data)


def extract_text_from_rft(rtf_data: str) -> str:
    return rtf_to_text(rtf_data)


def docx_reader(file_path: str) -> str:
    return "\n".join(paragraph.text for paragraph in Document(file_path).paragraphs)


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
        self.file_type = file_type if file_type else self.file_path.split(".")[-1]
        self._validate_file_type()
        self.config = self._get_text_extractor_config()

    def get_text(self) -> str:
        return self.config.extractor(self._read_file_data()).strip()

    def _read_file_data(self) -> bytes | str:
        if self.config.reader:
            return self.config.reader(self.file_path)
        with open_stream(self.file_path, self.config.read_mode) as f:
            return f.read()

    def _get_text_extractor_config(self) -> TextExtractorConfig:
        html_extractor_config = TextExtractorConfig(extractor=extract_text_from_html)
        return {
            "docx": TextExtractorConfig(reader=docx_reader),
            "pdf": TextExtractorConfig(extractor=extract_text_from_pdf, read_mode="rb"),
            "txt": TextExtractorConfig(),
            "html": html_extractor_config,
            "htm": html_extractor_config,
            "rtf": TextExtractorConfig(extractor=extract_text_from_rft),
        }[self.file_type]

    def _validate_file_type(self) -> None:
        if self.file_type.lower() not in TEXT_EXTRACTOR_SUPPORTED_FILE_TYPES:
            raise UnsupportedTextExtractorFileType(f"Unsupported file type: {self.file_type}")
