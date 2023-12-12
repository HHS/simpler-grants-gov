from sqlalchemy.orm import Mapped, mapped_column

from src.adapters.db.type_decorators.postgres_type_decorators import StrEnumColumn
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.base import Base, TimestampMixin


class Opportunity(Base, TimestampMixin):
    __tablename__ = "opportunity"

    opportunity_id: Mapped[int] = mapped_column(primary_key=True)

    opportunity_number: Mapped[str | None]
    opportunity_title: Mapped[str | None]

    agency: Mapped[str | None]

    category: Mapped[OpportunityCategory | None] = mapped_column(StrEnumColumn(OpportunityCategory))

    is_draft: Mapped[bool]
