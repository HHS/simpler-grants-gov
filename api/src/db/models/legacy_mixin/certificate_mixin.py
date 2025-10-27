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
    currentcertid: Mapped[str] = mapped_column(
        primary_key=True
    )  # currentcertid - text, primary key
    previouscertid: Mapped[str | None]  # previouscertid - text
    orgduns: Mapped[str | None]  # orgduns - text
    orgname: Mapped[str | None]  # orgname - text
    expirationdate: Mapped[date | None]  # expirationdate - date
    certemail: Mapped[str]  # certemail - text, not null
    agencyid: Mapped[str | None]  # agencyid - text
    requestorlname: Mapped[str | None]  # requestorlname - text
    requestorfname: Mapped[str | None]  # requestorfname - text
    created_date: Mapped[datetime]  # created_date - datetime, not null
    creator_id: Mapped[str]  # creator_id - text, not null
    last_upd_date: Mapped[datetime | None]  # last_upd_date - datetime
    last_upd_id: Mapped[str | None]  # last_upd_id - text
    is_selfsigned: Mapped[str]  # is_selfsigned - text, not null
    serial_num: Mapped[str | None]  # serial_num - text
    system_name: Mapped[str | None]  # system_name - text
