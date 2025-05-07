import uuid
from datetime import date

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkSamGovExtractType, LkSamGovProcessingStatus


class SamExtractFile(ApiSchemaTable, TimestampMixin):
    """Represents a SAM.gov extract file that has been processed"""

    __tablename__ = "sam_extract_file"

    sam_extract_file_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    extract_type: Mapped[SamGovExtractType] = mapped_column(
        "extract_type_id",
        LookupColumn(LkSamGovExtractType),
        ForeignKey(LkSamGovExtractType.sam_gov_extract_type_id),
        index=True,
    )
    extract_date: Mapped[date]
    filename: Mapped[str]
    s3_path: Mapped[str]
    processing_status: Mapped[SamGovProcessingStatus] = mapped_column(
        "processing_status_id",
        LookupColumn(LkSamGovProcessingStatus),
        ForeignKey(LkSamGovProcessingStatus.sam_gov_processing_status_id),
        index=True,
    )
