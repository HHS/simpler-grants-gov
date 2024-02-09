from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.base import Base, TimestampMixin
from src.db.models.lookup_models import LkOpportunityCategory


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

    """
    Not ported over from legacy system

    listed CHAR(1) - everything in the existing system is set to "L" for listed, so not any value
    initial_opportunity_id NUMBER(20) - existing docs say this field isn't used
    flag_2006 CHAR(1) (boolean) - a flag for presumably a prior migration, no use to us
    """
