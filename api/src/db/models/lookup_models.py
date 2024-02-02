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
