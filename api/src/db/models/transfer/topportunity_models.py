from datetime import date

from sqlalchemy import VARCHAR, Integer
from sqlalchemy.orm import Mapped, mapped_column

from src.db.models.base import Base, TimestampMixin

##########
# NOTES
##########
"""
These tables don't follow all of our normal conventions for tables as they
aim to match the schema of the current Oracle database. So this means we
use VARCHAR instead of TEXT at the moment, as well as have booleans stored as character columns.
"""


class TransferTopportunity(Base, TimestampMixin):
    __tablename__ = "transfer_topportunity"

    opportunity_id: Mapped[int] = mapped_column(Integer, primary_key=True)

    oppnumber: Mapped[str | None] = mapped_column(VARCHAR(length=160))
    opptitle: Mapped[str | None] = mapped_column(VARCHAR(length=1020), index=True)

    owningagency: Mapped[str | None] = mapped_column(VARCHAR(length=1020))

    oppcategory: Mapped[str | None] = mapped_column(VARCHAR(length=4), index=True)
    category_explanation: Mapped[str | None] = mapped_column(VARCHAR(length=1020))

    is_draft: Mapped[str] = mapped_column(VARCHAR(length=4), index=True)

    revision_number: Mapped[int | None]
    modified_comments: Mapped[str | None] = mapped_column(VARCHAR(length=4000))

    publisheruid: Mapped[str | None] = mapped_column(VARCHAR(length=1020))
    publisher_profile_id: Mapped[int | None]

    last_upd_id: Mapped[str | None] = mapped_column(VARCHAR(length=200))
    last_upd_date: Mapped[date | None]
    creator_id: Mapped[str | None] = mapped_column(VARCHAR(length=200))
    created_date: Mapped[date | None]

    def __repr__(self) -> str:
        def safe_repr(attr: int | str | date | None) -> str:
            """Safely format the attribute for __repr__, handling None values."""
            if attr is None:
                return "None"
            elif isinstance(attr, str):
                return f"{attr[:25]!r}..." if len(attr) > 25 else f"{attr!r}"
            else:
                return str(attr)

        return (
            f"<TransferTopportunity(opportunity_id={safe_repr(self.opportunity_id)}, "
            f"oppnumber={safe_repr(self.oppnumber)}, "
            f"opptitle={safe_repr(self.opptitle)}, "
            f"owningagency={safe_repr(self.owningagency)}, "
            f"oppcategory={safe_repr(self.oppcategory)}, "
            f"category_explanation={safe_repr(self.category_explanation)}, "
            f"is_draft={safe_repr(self.is_draft)}, "
            f"revision_number={safe_repr(self.revision_number)}, "
            f"modified_comments={safe_repr(self.modified_comments)}, "
            f"publisheruid={safe_repr(self.publisheruid)}, "
            f"publisher_profile_id={safe_repr(self.publisher_profile_id)}, "
            f"last_upd_id={safe_repr(self.last_upd_id)}, "
            f"last_upd_date={safe_repr(self.last_upd_date)}, "
            f"creator_id={safe_repr(self.creator_id)}, "
            f"created_date={safe_repr(self.created_date)})>"
        )
