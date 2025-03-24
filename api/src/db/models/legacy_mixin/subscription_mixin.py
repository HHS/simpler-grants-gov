#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

import datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TsubscriptionMixin:
    subscription_id: Mapped[int] = mapped_column(primary_key=True)
    user_account_id: Mapped[int | None]
    newsletters: Mapped[str | None]
    alerts: Mapped[str | None]
    all_new_opps: Mapped[str | None]
    opportunities: Mapped[str | None]
    saved_searches: Mapped[str | None]
    created_date: Mapped[datetime.datetime] = mapped_column(nullable=False)
    creator_id: Mapped[str] = mapped_column(nullable=False)
    last_upd_date: Mapped[datetime.datetime] = mapped_column(nullable=False)
    last_upd_id: Mapped[str] = mapped_column(nullable=False)


@declarative_mixin
class TsubscriptionSearchMixin:
    subscription_search_id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int | None]
    search_name: Mapped[str | None]
    search_params: Mapped[str | None]
    created_date: Mapped[datetime.datetime] = mapped_column(nullable=False)
    creator_id: Mapped[str] = mapped_column(nullable=False)
    last_upd_date: Mapped[datetime.datetime] = mapped_column(nullable=False)
    last_upd_id: Mapped[str] = mapped_column(nullable=False)


@declarative_mixin
class TsubscriptionOpportunityMixin:
    subscription_opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int | None]
    opportunity_id: Mapped[int | None]
    is_opp_deleted: Mapped[str | None]
    created_date: Mapped[datetime.datetime] = mapped_column(nullable=False)
    creator_id: Mapped[str] = mapped_column(nullable=False)
    last_upd_date: Mapped[datetime.datetime] = mapped_column(nullable=False)
    last_upd_id: Mapped[str] = mapped_column(nullable=False)
