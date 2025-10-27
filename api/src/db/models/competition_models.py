import uuid
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Sequence, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import (
    ApplicationAuditEvent,
    ApplicationStatus,
    CompetitionOpenToApplicant,
    FormFamily,
    FormType,
)
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.entity_models import Organization
from src.db.models.lookup_models import (
    LkApplicationAuditEvent,
    LkApplicationStatus,
    LkCompetitionOpenToApplicant,
    LkFormFamily,
    LkFormType,
)
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.util.datetime_util import get_now_us_eastern_date
from src.util.file_util import pre_sign_file_location, presign_or_s3_cdnify_url

# Add conditional import for type checking
if TYPE_CHECKING:
    from src.db.models.user_models import ApplicationUser, User


class Competition(ApiSchemaTable, TimestampMixin):
    __tablename__ = "competition"

    competition_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), index=True
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
    opportunity_assistance_listing_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey(OpportunityAssistanceListing.opportunity_assistance_listing_id)
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
    expected_application_count: Mapped[int | None] = mapped_column(BigInteger)
    expected_application_size_mb: Mapped[int | None] = mapped_column(BigInteger)
    is_multi_package: Mapped[bool | None]
    agency_download_url: Mapped[str | None]
    is_legacy_workspace_compatible: Mapped[bool | None]
    can_send_mail: Mapped[bool | None]
    is_simpler_grants_enabled: Mapped[bool | None] = mapped_column(default=False)

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
    def has_open_date(self) -> bool:
        """The competition has an open date if:
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

    @property
    def is_open(self) -> bool:
        """The competition is open if the following are all true:
        * The competition has is_simpler_grants_enabled set to True
        * The is_open_date property resolves to True
        """
        # Check if simpler grants is enabled for this competition first
        if self.is_simpler_grants_enabled is not True:
            return False
        return self.has_open_date


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

    @property
    def download_path(self) -> str:
        return presign_or_s3_cdnify_url(self.file_location)


class FormInstruction(ApiSchemaTable, TimestampMixin):
    __tablename__ = "form_instruction"

    form_instruction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    file_location: Mapped[str]
    file_name: Mapped[str]

    @property
    def download_path(self) -> str:
        return presign_or_s3_cdnify_url(self.file_location)


class CompetitionAssistanceListing(ApiSchemaTable, TimestampMixin):
    __tablename__ = "competition_assistance_listing"

    competition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Competition.competition_id), primary_key=True
    )
    competition: Mapped[Competition] = relationship(Competition)

    opportunity_assistance_listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
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
    # This is used for making files and should not contain spaces
    short_form_name: Mapped[str]
    form_version: Mapped[str]
    agency_code: Mapped[str]
    omb_number: Mapped[str | None]
    legacy_form_id: Mapped[int | None] = mapped_column(index=True, unique=True)
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

    form_rule_schema: Mapped[dict | None] = mapped_column(JSONB)
    json_to_xml_schema: Mapped[dict | None] = mapped_column(JSONB)

    form_type: Mapped[FormType | None] = mapped_column(
        "form_type_id",
        LookupColumn(LkFormType),
        ForeignKey(LkFormType.form_type_id),
    )
    sgg_version: Mapped[str | None]
    is_deprecated: Mapped[bool | None]


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

    submitted_at: Mapped[datetime | None]
    submitted_by: Mapped[uuid.UUID | None] = mapped_column(UUID, ForeignKey("api.user.user_id"))
    submitted_by_user: Mapped["User | None"] = relationship(
        "User", foreign_keys=[submitted_by], uselist=False
    )

    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey(Organization.organization_id)
    )
    organization: Mapped[Organization | None] = relationship(
        Organization, uselist=False, back_populates="applications"
    )

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

    application_submissions: Mapped[list["ApplicationSubmission"]] = relationship(
        "ApplicationSubmission",
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

    is_included_in_submission: Mapped[bool | None]

    @property
    def form(self) -> Form:
        """Property function for slightly easier access to the actual form object"""
        return self.competition_form.form

    @property
    def form_id(self) -> uuid.UUID:
        """Property function for slightly easier access to the form ID"""
        return self.competition_form.form_id

    @property
    def application_attachments(self) -> list["ApplicationAttachment"]:
        """Property function to access application attachments"""
        return self.application.application_attachments

    @property
    def application_name(self) -> str | None:
        return self.application.application_name

    @property
    def application_status(self) -> "ApplicationStatus | None":
        return self.application.application_status


class ApplicationAttachment(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_attachment"

    application_attachment_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    application_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Application.application_id))
    application: Mapped[Application] = relationship(Application)

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("api.user.user_id"), nullable=False)
    user: Mapped["User"] = relationship("User")

    file_location: Mapped[str]
    file_name: Mapped[str]
    mime_type: Mapped[str]
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)

    @property
    def download_path(self) -> str:
        """Get the presigned s3 url path for downloading the file"""
        # NOTE: These attachments will only ever be in a non-public
        # bucket so we only can presign their URL, we can't use the CDN path.
        return pre_sign_file_location(self.file_location)


class ApplicationSubmission(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_submission"

    application_submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Application.application_id), nullable=False
    )
    application: Mapped[Application] = relationship(
        Application, back_populates="application_submissions"
    )

    file_location: Mapped[str]
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)

    # Define a sequence for the legacy tracking number, note that
    # we start it 80 million because we want to easily be able to
    # separate it from grants.gov's value which at the time of writing
    # is in the 10-millions.
    legacy_tracking_number_seq: Sequence = Sequence(
        "legacy_tracking_number_seq", start=80_000_000, schema="api"
    )
    legacy_tracking_number: Mapped[int] = mapped_column(
        BigInteger,
        legacy_tracking_number_seq,
        server_default=legacy_tracking_number_seq.next_value(),
    )

    @property
    def download_path(self) -> str:
        """Get the presigned s3 url path for downloading the submission file"""
        # NOTE: These submission files will only ever be in a non-public
        # bucket so we only can presign their URL, we can't use the CDN path.
        return pre_sign_file_location(self.file_location)


class ShortLivedInternalToken(ApiSchemaTable, TimestampMixin):
    __tablename__ = "short_lived_internal_token"

    short_lived_internal_token_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    is_valid: Mapped[bool] = mapped_column(nullable=False, default=True)


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


class ApplicationAudit(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_audit"

    application_audit_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("api.user.user_id"), nullable=False, index=True
    )
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Application.application_id), nullable=False, index=True
    )
    application: Mapped[Application] = relationship(Application)

    application_audit_event: Mapped[ApplicationAuditEvent] = mapped_column(
        "application_audit_event_id",
        LookupColumn(LkApplicationAuditEvent),
        ForeignKey(LkApplicationAuditEvent.application_audit_event_id),
        nullable=False,
    )

    target_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey("api.user.user_id"), index=True
    )
    target_user: Mapped["User | None"] = relationship("User", foreign_keys=[target_user_id])

    target_application_form_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey(ApplicationForm.application_form_id)
    )
    target_application_form: Mapped[ApplicationForm | None] = relationship(ApplicationForm)

    target_attachment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey(ApplicationAttachment.application_attachment_id)
    )
    target_attachment: Mapped[ApplicationAttachment | None] = relationship(ApplicationAttachment)

    audit_metadata: Mapped[dict | None] = mapped_column(JSONB)
