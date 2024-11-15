from sqlalchemy import BigInteger, Column, DateTime, String, func

from db.models.lookup_models import LkExtractType
from src.db.models.base import ApiSchemaTable, TimestampMixin


class ExtractMetadata(ApiSchemaTable, TimestampMixin):
    __tablename__ = "extract_metadata"

    extract_metadata_id = Column(BigInteger, primary_key=True, autoincrement=True)
    extract_type = Column(LkExtractType, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
