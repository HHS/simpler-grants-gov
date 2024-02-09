from sqlalchemy.orm import Mapped, mapped_column

from src.constants import lookup_constants
from src.db.models.base import TimestampMixin
from src.db.models.lookup import Lookup, LookupRegistry, LookupTable


@LookupRegistry.register_lookup(lookup_constants.OPPORTUNITY_CATEGORY_CONFIG)
class LkOpportunityCategory(LookupTable, TimestampMixin):
    __tablename__ = "lk_opportunity_category"

    opportunity_category_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkOpportunityCategory":
        return LkOpportunityCategory(
            opportunity_category_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(lookup_constants.APPLICANT_TYPE_CONFIG)
class LkApplicantType(LookupTable, TimestampMixin):
    __tablename__ = "lk_applicant_type"

    applicant_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkApplicantType":
        return LkApplicantType(
            applicant_type_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(lookup_constants.FUNDING_CATEGORY_CONFIG)
class LkFundingCategory(LookupTable, TimestampMixin):
    __tablename__ = "lk_funding_category"

    funding_category_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkFundingCategory":
        return LkFundingCategory(
            funding_category_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(lookup_constants.FUNDING_INSTRUMENT_CONFIG)
class LkFundingInstrument(LookupTable, TimestampMixin):
    __tablename__ = "lk_funding_instrument"

    funding_instrument_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkFundingInstrument":
        return LkFundingInstrument(
            funding_instrument_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(lookup_constants.OPPORTUNITY_STATUS_CONFIG)
class LkOpportunityStatus(LookupTable, TimestampMixin):
    __tablename__ = "lk_opportunity_status"

    opportunity_status_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkOpportunityStatus":
        return LkOpportunityStatus(
            opportunity_status_id=lookup.lookup_val, description=lookup.get_description()
        )
