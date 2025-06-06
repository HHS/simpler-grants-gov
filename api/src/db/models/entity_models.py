import uuid
from datetime import date

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import SamGovImportType
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkSamGovImportType


class SamGovEntity(ApiSchemaTable, TimestampMixin):
    __tablename__ = "sam_gov_entity"

    sam_gov_entity_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    uei: Mapped[str] = mapped_column(index=True)
    legal_business_name: Mapped[str]
    expiration_date: Mapped[date]
    ebiz_poc_email: Mapped[str]
    ebiz_poc_first_name: Mapped[str]
    ebiz_poc_last_name: Mapped[str]
    has_debt_subject_to_offset: Mapped[bool | None]
    has_exclusion_status: Mapped[bool | None]
    eft_indicator: Mapped[str | None]

    # Relationships
    import_records: Mapped[list["SamGovEntityImportType"]] = relationship(
        back_populates="sam_gov_entity", cascade="all, delete-orphan"
    )
    organizations: Mapped[list["Organization"]] = relationship(
        back_populates="sam_gov_entity",
    )


class SamGovEntityImportType(ApiSchemaTable, TimestampMixin):
    __tablename__ = "sam_gov_entity_import_type"

    sam_gov_entity_import_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    sam_gov_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(SamGovEntity.sam_gov_entity_id), nullable=False
    )
    sam_gov_import_type: Mapped[SamGovImportType] = mapped_column(
        "sam_gov_import_type_id",
        LookupColumn(LkSamGovImportType),
        ForeignKey(LkSamGovImportType.sam_gov_import_type_id),
        nullable=False,
    )

    # Relationships
    sam_gov_entity: Mapped[SamGovEntity] = relationship(
        SamGovEntity, back_populates="import_records"
    )


class Organization(ApiSchemaTable, TimestampMixin):
    __tablename__ = "organization"

    organization_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    sam_gov_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey(SamGovEntity.sam_gov_entity_id), nullable=True
    )

    # Relationships
    sam_gov_entity: Mapped[SamGovEntity | None] = relationship(
        SamGovEntity, back_populates="organizations"
    )
