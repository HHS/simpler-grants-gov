#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

from datetime import date, datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column

from src.db.extension.sqlalchemy_column import StripZerosText


@declarative_mixin
class TcertificatesMixin:
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
    # We've encountered issues where is_selfsigned sometimes includes 0x00
    # Set the type as StripZerosText to strip those out when generating the create table command.
    is_selfsigned: Mapped[str | None] = mapped_column(StripZerosText)
    serial_num: Mapped[str | None]
    system_name: Mapped[str | None]
