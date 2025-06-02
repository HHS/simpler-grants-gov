import uuid
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import ApplicationStatus, CompetitionOpenToApplicant, FormFamily
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import (
    LkApplicationStatus,
    LkCompetitionOpenToApplicant,
    LkFormFamily,
)
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.util.datetime_util import get_now_us_eastern_date

# Add conditional import for type checking
if TYPE_CHECKING:
    from src.db.models.user_models import ApplicationUser, User


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
    opportunity_assistance_listing: Mapped[OpportunityAssistanceListing | None] = relationship(
        uselist=False
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

    competition_instructions: Mapped[list["CompetitionInstruction"]] = relationship(
        "CompetitionInstruction",
        uselist=True,
        back_populates="competition",
        cascade="all, delete-orphan",
    )

    @property
    def is_open(self) -> bool:
        """The competition is open if the following are both true:
        * It is on/after the competition opening date OR the opening date is null
        * It is on/before the competition close date + grace period OR the close date is null

        Effectively, if the date is null, the check isn't necessary, a competition
        with both opening and closing as null is open regardless of date.
        """

        current_date = get_now_us_eastern_date()

        # Check whether we're on/after the current date
        if self.opening_date is not None and current_date < self.opening_date:
            return False

        # If closing_date is not null, check if current date is after closing date + grace period
        if self.closing_date is not None:

            # If grace period is null/negative, make it 0
            grace_period = self.grace_period
            if grace_period is None or grace_period < 0:
                grace_period = 0

            actual_closing_date = self.closing_date + timedelta(days=grace_period)

            # if past the actual closing date, it's not open
            if current_date > actual_closing_date:
                return False

        # If it didn't hit any of the above cases
        # then we consider it to be open
        return True


class CompetitionInstruction(ApiSchemaTable, TimestampMixin):
    __tablename__ = "competition_instruction"

    competition_instruction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), primary_key=True
    )
    competition: Mapped[Competition] = relationship(
        Competition, back_populates="competition_instructions"
    )

    file_location: Mapped[str]
    file_name: Mapped[str]


class FormInstruction(ApiSchemaTable, TimestampMixin):
    __tablename__ = "form_instruction"

    form_instruction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    file_location: Mapped[str]
    file_name: Mapped[str]

    @property
    def download_path(self) -> str:
        from src.util.file_util import presign_or_s3_cdnify_url

        return presign_or_s3_cdnify_url(self.file_location)


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
    form_instruction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey(FormInstruction.form_instruction_id), nullable=True
    )
    form_instruction: Mapped[FormInstruction | None] = relationship(
        FormInstruction, cascade="all, delete-orphan", single_parent=True
    )


class CompetitionForm(ApiSchemaTable, TimestampMixin):
    __tablename__ = "competition_form"

    __table_args__ = (
        # We want to enforce that the competition doesn't have multiple of the same form
        UniqueConstraint("competition_id", "form_id"),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )

    competition_form_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), index=True
    )
    competition: Mapped[Competition] = relationship(Competition)

    form_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Form.form_id))
    form: Mapped[Form] = relationship(Form)

    is_required: Mapped[bool]


class Application(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application"

    application_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), nullable=False, index=True
    )
    competition: Mapped[Competition] = relationship(Competition)

    application_status: Mapped[ApplicationStatus | None] = mapped_column(
        "application_status_id",
        LookupColumn(LkApplicationStatus),
        ForeignKey(LkApplicationStatus.application_status_id),
    )

    application_name: Mapped[str | None]

    application_forms: Mapped[list["ApplicationForm"]] = relationship(
        "ApplicationForm", uselist=True, back_populates="application", cascade="all, delete-orphan"
    )

    application_users: Mapped[list["ApplicationUser"]] = relationship(
        "ApplicationUser", back_populates="application", uselist=True, cascade="all, delete-orphan"
    )

    application_attachments: Mapped[list["ApplicationAttachment"]] = relationship(
        "ApplicationAttachment",
        uselist=True,
        back_populates="application",
        cascade="all, delete-orphan",
    )

    @property
    def users(self) -> list["User"]:
        """Return the list of User objects associated with this application"""
        return [app_user.user for app_user in self.application_users]


class ApplicationForm(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_form"

    application_form_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    application_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Application.application_id))
    application: Mapped[Application] = relationship(Application)

    competition_form_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(CompetitionForm.competition_form_id)
    )
    competition_form: Mapped[CompetitionForm] = relationship(CompetitionForm)

    application_response: Mapped[dict] = mapped_column(JSONB)

    @property
    def form(self) -> Form:
        """Property function for slightly easier access to the actual form object"""
        return self.competition_form.form

    @property
    def form_id(self) -> uuid.UUID:
        """Property function for slightly easier access to the form ID"""
        return self.competition_form.form_id


class ApplicationAttachment(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_attachment"

    application_attachment_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    application_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Application.application_id))
    application: Mapped[Application] = relationship(Application)

    file_location: Mapped[str]
    file_name: Mapped[str]
    mime_type: Mapped[str]
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)


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
