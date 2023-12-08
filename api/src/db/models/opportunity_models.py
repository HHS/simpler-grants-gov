from sqlalchemy.orm import Mapped, mapped_column

from src.adapters.db.type_decorators.postgres_type_decorators import StrEnumColumn
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.base import Base, TimestampMixin


class Opportunity(Base, TimestampMixin):
    # NOTE: Keeping all names lower-case versions of the Oracle DBs naming
    # to follow the usual convention of Postgres.
    # names are automatically lowercased in all queries unless you quote them.
    # Once we've setup the replicated DB, we can adjust the naming here if needed.

    __tablename__ = "topportunity"

    opportunity_id: Mapped[int] = mapped_column("opportunity_id", primary_key=True)

    opportunity_number: Mapped[str | None] = mapped_column("oppnumber")
    opportunity_title: Mapped[str | None] = mapped_column("opptitle")

    agency: Mapped[str | None] = mapped_column("owningagency")

    category: Mapped[OpportunityCategory | None] = mapped_column(
        "oppcategory", StrEnumColumn(OpportunityCategory)
    )

    is_draft: Mapped[bool] = mapped_column("is_draft")


    new_column: Mapped[str | None]