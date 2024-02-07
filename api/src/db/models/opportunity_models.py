from datetime import date

from sqlalchemy import ForeignKey
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

    summary: Mapped["OpportunitySummary | None"] = relationship(
        back_populates="opportunity", single_parent=True, cascade="all, delete-orphan"
    )

    opportunity_assistance_listings: Mapped[list["OpportunityAssistanceListing"]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )
    link_funding_instruments: Mapped[list["LinkFundingInstrumentOpportunity"]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )
    link_funding_categories: Mapped[list["LinkFundingCategoryOpportunity"]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )
    link_applicant_types: Mapped[list["LinkApplicantTypeOpportunity"]] = relationship(
        back_populates="opportunity", uselist=True, cascade="all, delete-orphan"
    )


class OpportunitySummary(Base, TimestampMixin):
    __tablename__ = "opportunity_summary"

    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey(Opportunity.opportunity_id), primary_key=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    opportunity_status: Mapped[OpportunityStatus | None] = mapped_column(
        "opportunity_status_id",
        LookupColumn(LkOpportunityStatus),
        ForeignKey(LkOpportunityStatus.opportunity_status_id),
    )

    summary_description: Mapped[str | None]
    is_cost_sharing: Mapped[bool | None]

    close_date: Mapped[date | None]
    close_date_description: Mapped[str | None]

    post_date: Mapped[date | None]
    archive_date: Mapped[date | None]
    unarchive_date: Mapped[date | None]

    expected_number_of_awards: Mapped[int | None]
    estimated_total_program_funding: Mapped[int | None]
    award_floor: Mapped[str | None]
    award_ceiling: Mapped[str | None]

    additional_info_url: Mapped[str | None]
    additional_info_url_description: Mapped[str | None]

    version_number: Mapped[int | None]
    modification_comments: Mapped[str | None]

    funding_category_description: Mapped[str | None]
    applicant_eligibility_description: Mapped[str | None]

    agency_code: Mapped[str | None]
    agency_name: Mapped[str | None]
    agency_phone_number: Mapped[str | None]
    agency_contact_description: Mapped[str | None]
    agency_email_address: Mapped[str | None]
    agency_email_address_description: Mapped[str | None]

    can_send_mail: Mapped[bool | None]
    publisher_profile_id: Mapped[int | None]
    publisher_user_id: Mapped[str | None]
    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]


class OpportunityAssistanceListing(Base, TimestampMixin):
    __tablename__ = "opportunity_assistance_listing"

    opportunity_assistance_listing_id: Mapped[int] = mapped_column(primary_key=True)

    opportunity_id: Mapped[int] = mapped_column(ForeignKey(Opportunity.opportunity_id), index=True)
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    program_title: Mapped[str | None]

    assistance_listing_number: Mapped[str | None]

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]


class LinkFundingInstrumentOpportunity(Base, TimestampMixin):
    __tablename__ = "link_funding_instrument_opportunity"

    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey(Opportunity.opportunity_id), primary_key=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    funding_instrument: Mapped[FundingInstrument] = mapped_column(
        "funding_instrument_id",
        LookupColumn(LkFundingInstrument),
        ForeignKey(LkFundingInstrument.funding_instrument_id),
        primary_key=True,
    )

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]


class LinkFundingCategoryOpportunity(Base, TimestampMixin):
    __tablename__ = "link_funding_category_opportunity"

    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey(Opportunity.opportunity_id), primary_key=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    funding_category: Mapped[FundingCategory] = mapped_column(
        "funding_category_id",
        LookupColumn(LkFundingCategory),
        ForeignKey(LkFundingCategory.funding_category_id),
        primary_key=True,
    )

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]


class LinkApplicantTypeOpportunity(Base, TimestampMixin):
    __tablename__ = "link_applicant_type_opportunity"

    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey(Opportunity.opportunity_id), primary_key=True
    )
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    applicant_type: Mapped[ApplicantType] = mapped_column(
        "applicant_type_id",
        LookupColumn(LkApplicantType),
        ForeignKey(LkApplicantType.applicant_type_id),
        primary_key=True,
    )

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]
