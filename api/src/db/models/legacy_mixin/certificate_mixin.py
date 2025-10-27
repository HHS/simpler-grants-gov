#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

from datetime import date, datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TcertificateMixin:
    currentcertid: Mapped[str] = mapped_column(primary_key=True)
    previouscertid: Mapped[str | None]
    orgduns: Mapped[str | None]
    orgname: Mapped[str | None]
    expirationdate: Mapped[date | None]
    certemail: Mapped[str]
    agencyid: Mapped[str | None]
    requestorlname: Mapped[str | None]
    requestorfname: Mapped[str | None]
    requestoremail: Mapped[str | None]
    requestorphone: Mapped[str | None]
    created_date: Mapped[datetime]
    creator_id: Mapped[str]
    last_upd_date: Mapped[datetime | None]
    last_upd_id: Mapped[str | None]
    is_selfsigned: Mapped[str]
    serial_num: Mapped[str | None]
    system_name: Mapped[str | None]
