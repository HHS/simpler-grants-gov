import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityStatus,
)
from src.db.models.agency_models import Agency
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import (
    LkApplicantType,
    LkFundingCategory,
    LkFundingInstrument,
    LkOpportunityCategory,
    LkOpportunityStatus,
)
from src.util.file_util import presign_or_s3_cdnify_url

if TYPE_CHECKING:
    from src.db.models.competition_models import Competition
    from src.db.models.user_models import UserOpportunityNotificationLog, UserSavedOpportunity


class Opportunity(ApiSchemaTable, TimestampMixin):
    __tablename__ = "opportunity"

    opportunity_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    legacy_opportunity_id: Mapped[int] = mapped_column(BigInteger, index=True, unique=True)

    opportunity_number: Mapped[str | None]
    opportunity_title: Mapped[str | None] = mapped_column(index=True)
    agency_code: Mapped[str | None] = mapped_column(index=True)

    @property
    def agency(self) -> str | None:
        # TODO - this is temporary until the frontend no longer needs this name
        return self.agency_code

    category: Mapped[OpportunityCategory | None] = mapped_column(
        "opportunity_category_id",
        LookupColumn(LkOpportunityCategory),
        ForeignKey(LkOpportunityCategory.opportunity_category_id),
        index=True,
    )
    category_explanation: Mapped[str | None]

    is_draft: Mapped[bool] = mapped_column(index=True)

    revision_number: Mapped[int | None]
    modified_comments: Mapped[str | None]

    opportunity_attachments: Mapped[list[OpportunityAttachment]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )

    opportunity_assistance_listings: Mapped[list[OpportunityAssistanceListing]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )

    opportunity_change_audit: Mapped[OpportunityChangeAudit | None] = relationship(
        back_populates="opportunity", single_parent=True, cascade="all, delete-orphan"
    )

    current_opportunity_summary: Mapped[CurrentOpportunitySummary | None] = relationship(
        back_populates="opportunity", single_parent=True, cascade="all, delete-orphan"
    )

    all_opportunity_summaries: Mapped[list[OpportunitySummary]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )

    all_opportunity_notification_logs: Mapped[list[UserOpportunityNotificationLog]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )

    saved_opportunities_by_users: Mapped[list[UserSavedOpportunity]] = relationship(
        "UserSavedOpportunity",
        back_populates="opportunity",
        uselist=True,
        cascade="all, delete-orphan",
    )

    agency_record: Mapped[Agency | None] = relationship(
        Agency,
        primaryjoin="Opportunity.agency_code == foreign(Agency.agency_code)",
        uselist=False,
        viewonly=True,
    )

    competitions: Mapped[list[Competition]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )

    versions: Mapped[list[OpportunityVersion]] = relationship(
        "OpportunityVersion",
        back_populates="opportunity",
        uselist=True,
        cascade="all, delete-orphan",
    )

    @property
    def top_level_agency_name(self) -> str | None:
        if self.agency_record is not None and self.agency_record.top_level_agency is not None:
            return self.agency_record.top_level_agency.agency_name

        return self.agency_name

    @property
    def agency_name(self) -> str | None:
        # Fetch the agency name from the agency table record (if one was found)
        if self.agency_record is not None:
            return self.agency_record.agency_name

        return None

    @property
    def summary(self) -> OpportunitySummary | None:
        """
        Utility getter method for converting an Opportunity in our endpoints

        This handles mapping the current opportunity summary to the "summary" object
         in our API responses - handling nullablity as well.
        """
        if self.current_opportunity_summary is None:
            return None

        return self.current_opportunity_summary.opportunity_summary

    @property
    def opportunity_status(self) -> OpportunityStatus | None:
        if self.current_opportunity_summary is None:
            return None

        return self.current_opportunity_summary.opportunity_status

    @property
    def all_forecasts(self) -> list[OpportunitySummary]:
        # Utility method for getting all forecasted summary records attached to the opportunity
        # Note this will include historical and deleted records.
        return [summary for summary in self.all_opportunity_summaries if summary.is_forecast]

    @property
    def all_non_forecasts(self) -> list[OpportunitySummary]:
        # Utility method for getting all forecasted summary records attached to the opportunity
        # Note this will include historical and deleted records.
        return [summary for summary in self.all_opportunity_summaries if not summary.is_forecast]


class OpportunitySummary(ApiSchemaTable, TimestampMixin):
    __tablename__ = "opportunity_summary"

    __table_args__ = (
        UniqueConstraint("is_forecast", "opportunity_id"),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )

    opportunity_summary_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), index=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    legacy_opportunity_id: Mapped[int] = mapped_column(BigInteger, index=True)

    summary_description: Mapped[str | None]

    is_cost_sharing: Mapped[bool | None]
    is_forecast: Mapped[bool]

    post_date: Mapped[date | None]
    close_date: Mapped[date | None]
    close_date_description: Mapped[str | None]
    archive_date: Mapped[date | None]
    unarchive_date: Mapped[date | None]

    # The award amounts can be for several billion requiring us to use BigInteger
    expected_number_of_awards: Mapped[int | None] = mapped_column(BigInteger)
    estimated_total_program_funding: Mapped[int | None] = mapped_column(BigInteger)
    award_floor: Mapped[int | None] = mapped_column(BigInteger)
    award_ceiling: Mapped[int | None] = mapped_column(BigInteger)

    additional_info_url: Mapped[str | None]
    additional_info_url_description: Mapped[str | None]

    # Only if the summary is forecasted
    forecasted_post_date: Mapped[date | None]
    forecasted_close_date: Mapped[date | None]
    forecasted_close_date_description: Mapped[str | None]
    forecasted_award_date: Mapped[date | None]
    forecasted_project_start_date: Mapped[date | None]
    fiscal_year: Mapped[int | None]

    modification_comments: Mapped[str | None]

    funding_category_description: Mapped[str | None]
    applicant_eligibility_description: Mapped[str | None]

    agency_phone_number: Mapped[str | None]
    agency_contact_description: Mapped[str | None]
    agency_email_address: Mapped[str | None]
    agency_email_address_description: Mapped[str | None]

    version_number: Mapped[int | None]
    can_send_mail: Mapped[bool | None]

    # Do not use these agency fields, they're kept for now, but
    # are simply copying behavior from the legacy system - prefer
    # the same named values in the opportunity itself
    agency_code: Mapped[str | None]
    agency_name: Mapped[str | None]

    link_funding_instruments: Mapped[list[LinkOpportunitySummaryFundingInstrument]] = relationship(
        back_populates="opportunity_summary", uselist=True, cascade="all, delete-orphan"
    )
    link_funding_categories: Mapped[list[LinkOpportunitySummaryFundingCategory]] = relationship(
        back_populates="opportunity_summary", uselist=True, cascade="all, delete-orphan"
    )
    link_applicant_types: Mapped[list[LinkOpportunitySummaryApplicantType]] = relationship(
        back_populates="opportunity_summary", uselist=True, cascade="all, delete-orphan"
    )

    # Create an association proxy for each of the link table relationships
    # https://docs.sqlalchemy.org/en/20/orm/extensions/associationproxy.html
    #
    # This lets us use these values as if they were just ordinary lists on a python
    # object. For example::
    #
    #   opportunity.funding_instruments.add(FundingInstrument.GRANT)
    #
    # will add a row to the link_opportunity_summary_funding_instrument table itself
    # and is still capable of using all of our column mapping code uneventfully.
    funding_instruments: AssociationProxy[set[FundingInstrument]] = association_proxy(
        "link_funding_instruments",
        "funding_instrument",
        creator=lambda obj: LinkOpportunitySummaryFundingInstrument(funding_instrument=obj),
    )
    funding_categories: AssociationProxy[set[FundingCategory]] = association_proxy(
        "link_funding_categories",
        "funding_category",
        creator=lambda obj: LinkOpportunitySummaryFundingCategory(funding_category=obj),
    )
    applicant_types: AssociationProxy[set[ApplicantType]] = association_proxy(
        "link_applicant_types",
        "applicant_type",
        creator=lambda obj: LinkOpportunitySummaryApplicantType(applicant_type=obj),
    )

    # We configure a relationship from a summary to the current opportunity summary
    # Just in case we delete this record, we can cascade to deleting the current_opportunity_summary
    # record as well automatically.
    current_opportunity_summary: Mapped[CurrentOpportunitySummary | None] = relationship(
        back_populates="opportunity_summary", single_parent=True, cascade="delete"
    )

    def for_json(self) -> dict:
        json_valid_dict = super().for_json()

        # The proxy values don't end up in the JSON as they aren't columns
        # so manually add them.
        json_valid_dict["funding_instruments"] = self.funding_instruments
        json_valid_dict["funding_categories"] = self.funding_categories
        json_valid_dict["applicant_types"] = self.applicant_types

        return json_valid_dict

    def can_summary_be_public(self, current_date: date) -> bool:
        """
        Utility method to check whether a summary object
        """
        if self.post_date is None or self.post_date > current_date:
            return False

        return True


class OpportunityAssistanceListing(ApiSchemaTable, TimestampMixin):
    __tablename__ = "opportunity_assistance_listing"

    opportunity_assistance_listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    legacy_opportunity_assistance_listing_id: Mapped[int] = mapped_column(
        BigInteger, index=True, unique=True
    )

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), index=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    assistance_listing_number: Mapped[str | None]
    program_title: Mapped[str | None]


class LinkOpportunitySummaryFundingInstrument(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_opportunity_summary_funding_instrument"

    __table_args__ = (
        # We want a unique constraint so that legacy IDs are unique for a given opportunity summary
        UniqueConstraint("opportunity_summary_id", "legacy_funding_instrument_id"),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )
    opportunity_summary_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(OpportunitySummary.opportunity_summary_id), index=True, primary_key=True
    )
    opportunity_summary: Mapped[OpportunitySummary] = relationship(OpportunitySummary)

    funding_instrument: Mapped[FundingInstrument] = mapped_column(
        "funding_instrument_id",
        LookupColumn(LkFundingInstrument),
        ForeignKey(LkFundingInstrument.funding_instrument_id),
        primary_key=True,
        index=True,
    )

    legacy_funding_instrument_id: Mapped[int | None]


class LinkOpportunitySummaryFundingCategory(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_opportunity_summary_funding_category"

    __table_args__ = (
        # We want a unique constraint so that legacy IDs are unique for a given opportunity summary
        UniqueConstraint("opportunity_summary_id", "legacy_funding_category_id"),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )

    opportunity_summary_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(OpportunitySummary.opportunity_summary_id),
        primary_key=True,
        index=True,
    )
    opportunity_summary: Mapped[OpportunitySummary] = relationship(OpportunitySummary)

    funding_category: Mapped[FundingCategory] = mapped_column(
        "funding_category_id",
        LookupColumn(LkFundingCategory),
        ForeignKey(LkFundingCategory.funding_category_id),
        primary_key=True,
        index=True,
    )

    legacy_funding_category_id: Mapped[int | None]


class LinkOpportunitySummaryApplicantType(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_opportunity_summary_applicant_type"

    __table_args__ = (
        # We want a unique constraint so that legacy IDs are unique for a given opportunity summary
        UniqueConstraint("opportunity_summary_id", "legacy_applicant_type_id"),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )

    opportunity_summary_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(OpportunitySummary.opportunity_summary_id),
        primary_key=True,
        index=True,
    )
    opportunity_summary: Mapped[OpportunitySummary] = relationship(OpportunitySummary)

    applicant_type: Mapped[ApplicantType] = mapped_column(
        "applicant_type_id",
        LookupColumn(LkApplicantType),
        ForeignKey(LkApplicantType.applicant_type_id),
        primary_key=True,
        index=True,
    )

    legacy_applicant_type_id: Mapped[int | None]


class CurrentOpportunitySummary(ApiSchemaTable, TimestampMixin):
    __tablename__ = "current_opportunity_summary"

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), primary_key=True, index=True
    )
    opportunity: Mapped[Opportunity] = relationship(single_parent=True)

    opportunity_summary_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(OpportunitySummary.opportunity_summary_id),
        primary_key=True,
        index=True,
    )
    opportunity_summary: Mapped[OpportunitySummary] = relationship(single_parent=True)

    opportunity_status: Mapped[OpportunityStatus] = mapped_column(
        "opportunity_status_id",
        LookupColumn(LkOpportunityStatus),
        ForeignKey(LkOpportunityStatus.opportunity_status_id),
        index=True,
    )


class OpportunityAttachment(ApiSchemaTable, TimestampMixin):
    __tablename__ = "opportunity_attachment"

    attachment_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    legacy_attachment_id: Mapped[int] = mapped_column(BigInteger, index=True)

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), index=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    file_location: Mapped[str]
    mime_type: Mapped[str]
    file_name: Mapped[str]
    file_description: Mapped[str]
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)
    legacy_folder_id: Mapped[int | None] = mapped_column(BigInteger)

    @property
    def download_path(self) -> str | None:
        if self.file_location:
            return presign_or_s3_cdnify_url(self.file_location)
        return None


class OpportunityChangeAudit(ApiSchemaTable, TimestampMixin):
    __tablename__ = "opportunity_change_audit"

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), primary_key=True, index=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)
    is_loaded_to_search: Mapped[bool | None]
    is_loaded_to_version_table: Mapped[bool | None] = mapped_column(index=True)


class OpportunityVersion(ApiSchemaTable, TimestampMixin):
    __tablename__ = "opportunity_version"

    opportunity_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), primary_key=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity, back_populates="versions")

    opportunity_data: Mapped[dict] = mapped_column(JSONB)


class ExcludedOpportunityReview(ApiSchemaTable, TimestampMixin):
    __tablename__ = "excluded_opportunity_review"

    legacy_opportunity_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    omb_review_status_display: Mapped[str]
    omb_review_status_date: Mapped[datetime | None]
    last_update_date: Mapped[datetime | None]
