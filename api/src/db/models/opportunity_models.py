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

    def __repr__(self):
        return (f"<Opportunity(opportunity_id={self.opportunity_id}, "
                f"opportunity_number='{self.opportunity_number}', "
                f"opportunity_title='{self.opportunity_title}', "
                f"agency='{self.agency}', category='{self.category}', ")

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
    award_floor: Mapped[int | None]
    award_ceiling: Mapped[int | None]

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

    def __repr__(self):
        def format_attr(value):
            """Format the attribute to display 'None' or slice if it's a string."""
            if value is None:
                return 'None'
            elif isinstance(value, str):
                return f"'{value[:25]}...'" if len(value) > 25 else f"'{value}'"
            else:
                return value

        return (f"<OpportunitySummary("
                f"opportunity_id={format_attr(self.opportunity_id)}, "
                f"opportunity_status='{format_attr(self.opportunity_status)}', "
                f"summary_description={format_attr(self.summary_description)}, "
                f"is_cost_sharing={format_attr(self.is_cost_sharing)}, "
                f"close_date={format_attr(self.close_date)}, "
                f"close_date_description={format_attr(self.close_date_description)}, "
                f"post_date={format_attr(self.post_date)}, "
                f"archive_date={format_attr(self.archive_date)}, "
                f"unarchive_date={format_attr(self.unarchive_date)}, "
                f"expected_number_of_awards={format_attr(self.expected_number_of_awards)}, "
                f"estimated_total_program_funding={format_attr(self.estimated_total_program_funding)}, "
                f"award_floor={format_attr(self.award_floor)}, "
                f"award_ceiling={format_attr(self.award_ceiling)}, "
                f"additional_info_url={format_attr(self.additional_info_url)}, "
                f"additional_info_url_description={format_attr(self.additional_info_url_description)}, "
                f"version_number={format_attr(self.version_number)}, "
                f"modification_comments={format_attr(self.modification_comments)}, "
                f"funding_category_description={format_attr(self.funding_category_description)}, "
                f"applicant_eligibility_description={format_attr(self.applicant_eligibility_description)}, "
                f"agency_code={format_attr(self.agency_code)}, "
                f"agency_name={format_attr(self.agency_name)}, "
                f"agency_phone_number={format_attr(self.agency_phone_number)}, "
                f"agency_contact_description={format_attr(self.agency_contact_description)}, "
                f"agency_email_address={format_attr(self.agency_email_address)}, "
                f"agency_email_address_description={format_attr(self.agency_email_address_description)}, "
                f"can_send_mail={format_attr(self.can_send_mail)}, "
                f"publisher_profile_id={format_attr(self.publisher_profile_id)}, "
                f"publisher_user_id={format_attr(self.publisher_user_id)}, "
                f"updated_by={format_attr(self.updated_by)}, "
                f"created_by={format_attr(self.created_by)})"
                f">")


class OpportunityAssistanceListing(Base, TimestampMixin):
    __tablename__ = "opportunity_assistance_listing"

    opportunity_assistance_listing_id: Mapped[int] = mapped_column(primary_key=True)

    opportunity_id: Mapped[int] = mapped_column(ForeignKey(Opportunity.opportunity_id), index=True)
    opportunity: Mapped[Opportunity] = relationship(Opportunity)

    program_title: Mapped[str | None]

    assistance_listing_number: Mapped[str | None]

    updated_by: Mapped[str | None]
    created_by: Mapped[str | None]

    def __repr__(self):
        return (f"<OpportunityAssistanceListing("
                f"opportunity_assistance_listing_id={self.opportunity_assistance_listing_id}, "
                f"opportunity_id={self.opportunity_id}, "
                f"assistance_listing_number='{self.assistance_listing_number}', "
                f"program_title='{self.program_title}', "
                f"updated_by='{self.updated_by}', "
                f"created_by='{self.created_by}')>")

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

    def __repr__(self):
        return (f"<LinkFundingInstrumentOpportunity(opportunity_id={self.opportunity_id}, "
                f"funding_instrument='{self.funding_instrument}', "
                f"updated_by='{self.updated_by}', created_by='{self.created_by}')>")



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

    def __repr__(self):
        return (f"<LinkFundingCategoryOpportunity(opportunity_id={self.opportunity_id}, "
                f"funding_category='{self.funding_category}', "
                f"updated_by='{self.updated_by}', created_by='{self.created_by}')>")

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

    def __repr__(self):
        return (f"<LinkApplicantTypeOpportunity(opportunity_id={self.opportunity_id}, "
                f"applicant_type='{self.applicant_type}', "
                f"updated_by='{self.updated_by}', created_by='{self.created_by}')>")
