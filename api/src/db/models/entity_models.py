import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import SamGovImportType
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkSamGovImportType

# Add conditional import for type checking to avoid circular imports
if TYPE_CHECKING:
    from src.db.models.competition_models import Application
    from src.db.models.user_models import OrganizationUser


class SamGovEntity(ApiSchemaTable, TimestampMixin):
    __tablename__ = "sam_gov_entity"

    sam_gov_entity_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    uei: Mapped[str] = mapped_column(index=True, unique=True)
    legal_business_name: Mapped[str]
    expiration_date: Mapped[date]
    initial_registration_date: Mapped[date]
    last_update_date: Mapped[date]
    ebiz_poc_email: Mapped[str] = mapped_column(index=True)
    ebiz_poc_first_name: Mapped[str]
    ebiz_poc_last_name: Mapped[str]
    has_debt_subject_to_offset: Mapped[bool | None]
    has_exclusion_status: Mapped[bool | None]
    eft_indicator: Mapped[str | None]

    is_inactive: Mapped[bool | None] = mapped_column(default=False)
    inactivated_at: Mapped[date | None]

    # Relationships
    import_records: Mapped[list["SamGovEntityImportType"]] = relationship(
        back_populates="sam_gov_entity", cascade="all, delete-orphan"
    )
    organization: Mapped["Organization | None"] = relationship(
        back_populates="sam_gov_entity", uselist=False
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
        UUID, ForeignKey(SamGovEntity.sam_gov_entity_id), nullable=True, unique=True
    )

    # Relationships
    sam_gov_entity: Mapped[SamGovEntity | None] = relationship(
        SamGovEntity, back_populates="organization"
    )

    organization_users: Mapped[list["OrganizationUser"]] = relationship(
        "OrganizationUser",
        uselist=True,
        back_populates="organization",
        cascade="all, delete-orphan",
    )

    applications: Mapped[list["Application"]] = relationship(
        "Application", uselist=True, back_populates="organization", cascade="all, delete-orphan"
    )
