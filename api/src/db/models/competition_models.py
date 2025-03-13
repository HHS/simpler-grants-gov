import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.models.base import ApiSchemaTable, TimestampMixin
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

    competition_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Form.form_id), primary_key=True
    )
    form: Mapped[Form] = relationship(Form)
    is_required: Mapped[bool]


class Application(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application"

    application_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), nullable=False, index=True
    )
    competition: Mapped[Competition] = relationship(Competition)


class ApplicationForm(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_form"

    application_form_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Application.application_id), nullable=False
    )
    application: Mapped[Application] = relationship(Application)
    
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Form.form_id), nullable=False
    )
    form: Mapped[Form] = relationship(Form)
    application_response: Mapped[dict] = mapped_column(JSONB, nullable=False)