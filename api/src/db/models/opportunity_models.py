from datetime import date

from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityStatus,
)
from src.db.models.base import Base, TimestampMixin
from src.db.models.lookup_models import (
    LkApplicantType,
    LkFundingCategory,
    LkFundingInstrument,
    LkOpportunityCategory,
    LkOpportunityStatus,
)


class Opportunity(Base, TimestampMixin):
    __tablename__ = "opportunity"

    opportunity_id: Mapped[int] = mapped_column(primary_key=True)

    opportunity_number: Mapped[str | None]
    opportunity_title: Mapped[str | None] = mapped_column(index=True)

    agency: Mapped[str | None]

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

    # These presumably refer to the TUSER_ACCOUNT, and TUSER_PROFILE tables
    # although the legacy DB does not have them setup as foreign keys
    publisher_user_id: Mapped[int | None]
    publisher_profile_id: Mapped[int | None]

    opportunity_assistance_listings: Mapped[list["OpportunityAssistanceListing"]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )

    current_opportunity_summary: Mapped["CurrentOpportunitySummary | None"] = relationship(
        back_populates="opportunity", single_parent=True, cascade="all, delete-orphan"
    )

    @property
    def summary(self) -> "OpportunitySummary | None":
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


class OpportunitySummary(Base, TimestampMixin):
    __tablename__ = "opportunity_summary"

    opportunity_summary_id: Mapped[int] = mapped_column(primary_key=True)

    opportunity_id: Mapped[int] = mapped_column(ForeignKey(Opportunity.opportunity_id))
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    summary_description: Mapped[str | None]

    is_cost_sharing: Mapped[bool | None]
    is_forecast: Mapped[bool | None]

    post_date: Mapped[date | None]
    close_date: Mapped[date | None]
    close_date_description: Mapped[str | None]
    archive_date: Mapped[date | None]
    unarchive_date: Mapped[date | None]

    # The award amounts can be for several billion requiring us to use BigInteger
    expected_number_of_awards: Mapped[int | None]
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

    revision_number: Mapped[int | None]
    modification_comments: Mapped[str | None]

    funding_category_description: Mapped[str | None]
    applicant_eligibility_description: Mapped[str | None]

    agency_code: Mapped[str | None]
    agency_name: Mapped[str | None]
    agency_phone_number: Mapped[str | None]
    agency_contact_description: Mapped[str | None]
    agency_email_address: Mapped[str | None]
    agency_email_address_description: Mapped[str | None]

    is_deleted: Mapped[bool | None]

    can_send_mail: Mapped[bool | None]
    publisher_profile_id: Mapped[int | None]
    publisher_user_id: Mapped[str | None]
    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]

    link_funding_instruments: Mapped[list["LinkFundingInstrumentSummary"]] = relationship(
        back_populates="opportunity_summary", uselist=True, cascade="all, delete-orphan"
    )
    link_funding_categories: Mapped[list["LinkFundingCategorySummary"]] = relationship(
        back_populates="opportunity_summary", uselist=True, cascade="all, delete-orphan"
    )
    link_applicant_types: Mapped[list["LinkApplicantTypeSummary"]] = relationship(
        back_populates="opportunity_summary", uselist=True, cascade="all, delete-orphan"
    )

    @property
    def funding_instruments(self) -> list[FundingInstrument]:
        # Helper method for serialization of the API response
        return [f.funding_instrument for f in self.link_funding_instruments]

    @property
    def funding_categories(self) -> list[FundingCategory]:
        # Helper method for serialization of the API response
        return [f.funding_category for f in self.link_funding_categories]

    @property
    def applicant_types(self) -> list[ApplicantType]:
        # Helper method for serialization of the API response
        return [a.applicant_type for a in self.link_applicant_types]


class OpportunityAssistanceListing(Base, TimestampMixin):
    __tablename__ = "opportunity_assistance_listing"

    opportunity_assistance_listing_id: Mapped[int] = mapped_column(primary_key=True)

    opportunity_id: Mapped[int] = mapped_column(ForeignKey(Opportunity.opportunity_id), index=True)
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    assistance_listing_number: Mapped[str | None]
    program_title: Mapped[str | None]

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]


class LinkFundingInstrumentSummary(Base, TimestampMixin):
    __tablename__ = "link_funding_instrument_summary"

    opportunity_summary_id: Mapped[int] = mapped_column(
        ForeignKey(OpportunitySummary.opportunity_summary_id), primary_key=True
    )
    opportunity_summary: Mapped[OpportunitySummary] = relationship(OpportunitySummary)

    funding_instrument: Mapped[FundingInstrument] = mapped_column(
        "funding_instrument_id",
        LookupColumn(LkFundingInstrument),
        ForeignKey(LkFundingInstrument.funding_instrument_id),
        primary_key=True,
    )

    legacy_funding_instrument_id: Mapped[int | None]

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]


class LinkFundingCategorySummary(Base, TimestampMixin):
    __tablename__ = "link_funding_category_summary"

    opportunity_summary_id: Mapped[int] = mapped_column(
        ForeignKey(OpportunitySummary.opportunity_summary_id), primary_key=True
    )
    opportunity_summary: Mapped[OpportunitySummary] = relationship(OpportunitySummary)

    funding_category: Mapped[FundingCategory] = mapped_column(
        "funding_category_id",
        LookupColumn(LkFundingCategory),
        ForeignKey(LkFundingCategory.funding_category_id),
        primary_key=True,
    )

    legacy_funding_category_id: Mapped[int | None]

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]


class LinkApplicantTypeSummary(Base, TimestampMixin):
    __tablename__ = "link_applicant_type_summary"

    opportunity_summary_id: Mapped[int] = mapped_column(
        ForeignKey(OpportunitySummary.opportunity_summary_id), primary_key=True
    )
    opportunity_summary: Mapped[OpportunitySummary] = relationship(OpportunitySummary)

    applicant_type: Mapped[ApplicantType] = mapped_column(
        "applicant_type_id",
        LookupColumn(LkApplicantType),
        ForeignKey(LkApplicantType.applicant_type_id),
        primary_key=True,
    )

    legacy_applicant_type_id: Mapped[int | None]

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]


class CurrentOpportunitySummary(Base, TimestampMixin):
    __tablename__ = "current_opportunity_summary"

    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey(Opportunity.opportunity_id), primary_key=True
    )
    opportunity: Mapped[Opportunity] = relationship(
        single_parent=True, cascade="all, delete-orphan"
    )

    opportunity_summary_id: Mapped[int] = mapped_column(
        ForeignKey(OpportunitySummary.opportunity_summary_id), primary_key=True
    )
    opportunity_summary: Mapped[OpportunitySummary] = relationship(
        single_parent=True, cascade="all, delete-orphan"
    )

    opportunity_status: Mapped[OpportunityStatus] = mapped_column(
        "opportunity_status_id",
        LookupColumn(LkOpportunityStatus),
        ForeignKey(LkOpportunityStatus.opportunity_status_id),
    )
