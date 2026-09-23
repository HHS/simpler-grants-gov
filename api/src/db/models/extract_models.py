import uuid

from sqlalchemy import UUID, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.constants.lookup_constants import ExtractType
from src.db.models.api_schema_table import ApiSchemaTable
from src.db.models.base import TimestampMixin
from src.db.models.lookup.lookup_column import LookupColumn
from src.db.models.lookup_models import LkExtractType
from src.util.file_util import safe_presign_or_s3_cdnify_url


class ExtractMetadata(ApiSchemaTable, TimestampMixin):
    __tablename__ = "extract_metadata"

    extract_metadata_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    extract_type: Mapped[ExtractType] = mapped_column(
        "extract_type_id",
        LookupColumn(LkExtractType),
        ForeignKey(LkExtractType.extract_type_id),
    )
    file_name: Mapped[str]
    file_path: Mapped[str]
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)

    @property
    def download_path(self) -> str | None:
        return safe_presign_or_s3_cdnify_url(self.file_path)
