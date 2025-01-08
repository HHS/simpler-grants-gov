#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

from sqlalchemy.orm import Mapped, foreign, relationship

from src.db.models.legacy_mixin import synopsis_mixin

from . import foreignbase
from .opportunity import Topportunity


class TsynopsisAttachment(foreignbase.ForeignBase, synopsis_mixin.TsynopsisAttachmentMixin):
    __tablename__ = "tsynopsisattachment"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin=lambda: TsynopsisAttachment.opportunity_id
        == foreign(Topportunity.opportunity_id),
        uselist=False,
        overlaps="opportunity",
    )
