import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import CompetitionOpenToApplicant, FormFamily
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkCompetitionOpenToApplicant, LkFormFamily
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing


class Competition(ApiSchemaTable, TimestampMixin):
    __tablename__ = "competition"

    competition_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey(Opportunity.opportunity_id), index=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    legacy_competition_id: Mapped[int | None] = mapped_column(BigInteger, index=True)
    public_competition_id: Mapped[str | None]
    legacy_package_id: Mapped[str | None]
    competition_title: Mapped[str | None]

    opening_date: Mapped[date | None]
    closing_date: Mapped[date | None]
    grace_period: Mapped[int | None] = mapped_column(BigInteger)
    contact_info: Mapped[str | None]

    form_family: Mapped[FormFamily | None] = mapped_column(
        "form_family_id",
        LookupColumn(LkFormFamily),
        ForeignKey(LkFormFamily.form_family_id),
        index=True,
    )
    opportunity_assistance_listing_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey(OpportunityAssistanceListing.opportunity_assistance_listing_id)
    )
    link_competition_open_to_applicant: Mapped[list["LinkCompetitionOpenToApplicant"]] = (
        relationship(back_populates="competition", uselist=True, cascade="all, delete-orphan")
    )
    open_to_applicants: AssociationProxy[set[CompetitionOpenToApplicant]] = association_proxy(
        "link_competition_open_to_applicant",
        "competition_open_to_applicant",
        creator=lambda obj: LinkCompetitionOpenToApplicant(competition_open_to_applicant=obj),
    )
    is_electronic_required: Mapped[bool | None]
    expected_application_count: Mapped[int | None]
    expected_application_size_mb: Mapped[int | None] = mapped_column(BigInteger)
    is_multi_package: Mapped[bool | None]
    agency_download_url: Mapped[str | None]
    is_legacy_workspace_compatible: Mapped[bool | None]
    can_send_mail: Mapped[bool | None]

    competition_forms: Mapped[list["CompetitionForm"]] = relationship(
        "CompetitionForm", uselist=True, back_populates="competition", cascade="all, delete-orphan"
    )

    applications: Mapped[list["Application"]] = relationship(
        "Application", uselist=True, back_populates="competition", cascade="all, delete-orphan"
    )


class CompetitionInstruction(ApiSchemaTable, TimestampMixin):
    __tablename__ = "competition_instruction"

    competition_instruction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), primary_key=True
    )
    competition: Mapped[Competition] = relationship(Competition)

    file_location: Mapped[str]


class CompetitionAssistanceListing(ApiSchemaTable, TimestampMixin):
    __tablename__ = "competition_assistance_listing"

    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), primary_key=True
    )
    competition: Mapped[Competition] = relationship(Competition)

    opportunity_assistance_listing_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(OpportunityAssistanceListing.opportunity_assistance_listing_id),
        primary_key=True,
    )
    opportunity_assistance_listing: Mapped[OpportunityAssistanceListing] = relationship(
        OpportunityAssistanceListing
    )


class Form(ApiSchemaTable, TimestampMixin):
    __tablename__ = "form"

    form_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    form_name: Mapped[str]
    form_version: Mapped[str]
    agency_code: Mapped[str]
    omb_number: Mapped[str | None]
    active_at: Mapped[datetime | None]
    inactive_at: Mapped[datetime | None]
    form_json_schema: Mapped[dict] = mapped_column(JSONB, nullable=False)
    form_ui_schema: Mapped[dict] = mapped_column(JSONB, nullable=False)


class CompetitionForm(ApiSchemaTable, TimestampMixin):
    __tablename__ = "competition_form"

    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), primary_key=True
    )
    competition: Mapped[Competition] = relationship(Competition)

    form_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Form.form_id), primary_key=True)
    form: Mapped[Form] = relationship(Form)

    is_required: Mapped[bool]


class Application(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application"

    application_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), nullable=False, index=True
    )
    competition: Mapped[Competition] = relationship(Competition)

    application_forms: Mapped[list["ApplicationForm"]] = relationship(
        "ApplicationForm", uselist=True, back_populates="application", cascade="all, delete-orphan"
    )


class ApplicationForm(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_form"

    application_form_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Application.application_id), nullable=False
    )
    application: Mapped[Application] = relationship(Application)

    form_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Form.form_id), nullable=False)
    form: Mapped[Form] = relationship(Form)
    application_response: Mapped[dict] = mapped_column(JSONB, nullable=False)


class LinkCompetitionOpenToApplicant(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_competition_open_to_applicant"

    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), primary_key=True
    )
    competition: Mapped[Competition] = relationship(Competition)
    competition_open_to_applicant: Mapped[CompetitionOpenToApplicant] = mapped_column(
        "competition_open_to_applicant_id",
        LookupColumn(LkCompetitionOpenToApplicant),
        ForeignKey(LkCompetitionOpenToApplicant.competition_open_to_applicant_id),
        primary_key=True,
    )
