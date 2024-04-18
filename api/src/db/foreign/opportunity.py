#
# SQLAlchemy models for foreign tables.
#

import datetime

import sqlalchemy
from sqlalchemy.orm import Mapped, mapped_column

from . import base


class Topportunity(base.Base):
    __tablename__ = "topportunity"

    opportunity_id: Mapped[int] = mapped_column(sqlalchemy.BigInteger, primary_key=True)
    oppnumber: Mapped[str | None]
    revision_number: Mapped[int] = mapped_column(sqlalchemy.BigInteger)
    opptitle: Mapped[str | None]
    owningagency: Mapped[str | None]
    publisheruid: Mapped[str | None]
    listed: Mapped[str | None]
    oppcategory: Mapped[str | None]
    initial_opportunity_id: Mapped[int] = mapped_column(sqlalchemy.BigInteger)
    modified_comments: Mapped[str | None]
    created_date: Mapped[datetime.datetime] = mapped_column(sqlalchemy.TIMESTAMP(timezone=True))
    last_upd_date: Mapped[datetime.datetime] = mapped_column(sqlalchemy.TIMESTAMP(timezone=True))
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    flag_2006: Mapped[str | None]
    category_explanation: Mapped[str | None]
    publisher_profile_id: Mapped[int] = mapped_column(sqlalchemy.BigInteger)
    is_draft: Mapped[str | None]


class TopportunityCfda(base.Base):
    __tablename__ = "topportunity_cfda"

    programtitle: Mapped[str | None]
    origtoppid: Mapped[int | None] = mapped_column(sqlalchemy.BigInteger)
    origoppnum: Mapped[str | None]
    opp_cfda_id: Mapped[int] = mapped_column(sqlalchemy.BigInteger, primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(sqlalchemy.BigInteger)
    oppidcfdanum: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None] = mapped_column(
        sqlalchemy.TIMESTAMP(timezone=True)
    )
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None] = mapped_column(
        sqlalchemy.TIMESTAMP(timezone=True)
    )
    cfdanumber: Mapped[str | None]
