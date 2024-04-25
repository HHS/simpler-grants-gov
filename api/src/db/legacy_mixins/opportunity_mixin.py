#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

import datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TopportunityMixin:
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    oppnumber: Mapped[str | None]
    revision_number: Mapped[int | None]
    opptitle: Mapped[str | None]
    owningagency: Mapped[str | None]
    publisheruid: Mapped[str | None]
    listed: Mapped[str | None]
    oppcategory: Mapped[str | None]
    initial_opportunity_id: Mapped[int | None]
    modified_comments: Mapped[str | None]
    created_date: Mapped[datetime.datetime]
    last_upd_date: Mapped[datetime.datetime]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    flag_2006: Mapped[str | None]
    category_explanation: Mapped[str | None]
    publisher_profile_id: Mapped[int | None]
    is_draft: Mapped[str | None]


@declarative_mixin
class TopportunityCfdaMixin:
    opp_cfda_id: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int]
    cfdanumber: Mapped[str | None]
    programtitle: Mapped[str | None]
    origtoppid: Mapped[int | None]
    oppidcfdanum: Mapped[str | None]
    origoppnum: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
