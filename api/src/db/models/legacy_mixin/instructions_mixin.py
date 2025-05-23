#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

import datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TinstructionsMixin:
    comp_id: Mapped[int] = mapped_column(primary_key=True)
    extension: Mapped[str | None]
    mimetype: Mapped[str | None]
    instructions: Mapped[bytes | None]
    last_update: Mapped[datetime.datetime | None]
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
