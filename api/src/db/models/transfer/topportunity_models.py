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
