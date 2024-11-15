from sqlalchemy import BigInteger, Column, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import ExtractType
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkExtractType


class ExtractMetadata(ApiSchemaTable, TimestampMixin):
    __tablename__ = "extract_metadata"

    extract_metadata_id = mapped_column(BigInteger, primary_key=True)
    extract_type: Mapped[ExtractType] = mapped_column(
        "extract_type_id",
        LookupColumn(LkExtractType),
        ForeignKey(LkExtractType.extract_type_id),
    )
    file_name: Mapped[str]
    file_path: Mapped[str]
    file_size_bytes: Mapped[str]
