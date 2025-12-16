import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import OrganizationInvitationStatus, SamGovImportType
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkSamGovImportType
from src.util.datetime_util import utcnow

# Add conditional import for type checking to avoid circular imports
if TYPE_CHECKING:
    from src.db.models.competition_models import Application
    from src.db.models.user_models import OrganizationUser, Role, User


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
    import_records: Mapped[list[SamGovEntityImportType]] = relationship(
        back_populates="sam_gov_entity", cascade="all, delete-orphan"
    )
    organization: Mapped[Organization | None] = relationship(
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

    organization_users: Mapped[list[OrganizationUser]] = relationship(
        "OrganizationUser",
        uselist=True,
        back_populates="organization",
        cascade="all, delete-orphan",
    )

    applications: Mapped[list[Application]] = relationship(
        "Application", uselist=True, back_populates="organization", cascade="all, delete-orphan"
    )

    @property
    def organization_name(self) -> str | None:
        return self.sam_gov_entity.legal_business_name if self.sam_gov_entity else None


class OrganizationInvitation(ApiSchemaTable, TimestampMixin):
    __tablename__ = "organization_invitation"

    organization_invitation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Organization.organization_id)
    )
    organization: Mapped[Organization] = relationship(Organization)

    inviter_user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("api.user.user_id"))
    inviter_user: Mapped[User] = relationship("User", foreign_keys=[inviter_user_id])
    invitee_email: Mapped[str]
    accepted_at: Mapped[datetime | None]
    rejected_at: Mapped[datetime | None]
    expires_at: Mapped[datetime]
    invitee_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey("api.user.user_id"), nullable=True
    )
    invitee_user: Mapped[User | None] = relationship("User", foreign_keys=[invitee_user_id])
    linked_roles: Mapped[list[LinkOrganizationInvitationToRole]] = relationship(
        "LinkOrganizationInvitationToRole",
        back_populates="organization_invitation",
        uselist=True,
        cascade="all, delete-orphan",
    )

    @property
    def roles(self) -> list[Role]:
        """Get the roles associated with this invitation"""
        return [link.role for link in self.linked_roles]

    @property
    def status(self) -> OrganizationInvitationStatus:
        if self.accepted_at is not None:
            return OrganizationInvitationStatus.ACCEPTED
        if self.rejected_at is not None:
            return OrganizationInvitationStatus.REJECTED
        if self.is_expired:
            return OrganizationInvitationStatus.EXPIRED

        return OrganizationInvitationStatus.PENDING

    @property
    def is_expired(self) -> bool:
        return utcnow() > self.expires_at

    @property
    def is_pending(self) -> bool:
        return self.status == OrganizationInvitationStatus.PENDING

    @property
    def can_respond(self) -> bool:
        return self.is_pending and not self.is_expired

    @property
    def responded_at(self) -> datetime | None:
        if self.status == OrganizationInvitationStatus.ACCEPTED:
            return self.accepted_at
        if self.status == OrganizationInvitationStatus.REJECTED:
            return self.rejected_at
        return None


class LinkOrganizationInvitationToRole(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_organization_invitation_to_role"

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("api.role.role_id"), primary_key=True)
    role: Mapped[Role] = relationship("Role")

    organization_invitation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(OrganizationInvitation.organization_invitation_id), primary_key=True
    )
    organization_invitation: Mapped[OrganizationInvitation] = relationship(OrganizationInvitation)


class IgnoredLegacyOrganizationUser(ApiSchemaTable, TimestampMixin):
    __tablename__ = "ignored_legacy_organization_user"
    __table_args__ = (
        # We want a unique constraint to prevent duplicate hide records for an organization
        UniqueConstraint("organization_id", "email"),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )

    ignored_legacy_organization_user_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Organization.organization_id))
    organization: Mapped[Organization] = relationship(Organization)
    email: Mapped[str] = mapped_column(index=True)
    ignored_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("api.user.user_id"), index=True
    )
    user: Mapped[User] = relationship("User")

class OrganizationAudit(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_audit"

    organization_audit_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("api.user.user_id"), nullable=False, index=True
    )
    user: Mapped[User] = relationship("User", foreign_keys=[user_id])

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Organization.organization_id), nullable=False, index=True
    )
    organization: Mapped[Organization] = relationship(Organization)

    organization_audit_event: Mapped[OrganizationAuditEvent] = mapped_column(
            "organization_audit_event_id",
            LookupColumn(LkOrganizationAuditEvent),
            ForeignKey(LkOrganizationAuditEvent.organization_audit_event_id),
            nullable=False,
        )
    target_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey("api.user.user_id"), index=True
    )
    target_user: Mapped[User | None] = relationship("User", foreign_keys=[target_user_id])
    audit_metadata: Mapped[dict | None] = mapped_column(JSONB)
