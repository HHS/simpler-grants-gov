#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

from src.db.models.legacy_mixin import synopsis_mixin

from . import foreignbase

class TsynopsisAttachment(foreignbase.ForeignBase, synopsis_mixin.TsynopsisAttachmentMixin):
    __tablename__ = "tsynopsis_attachment"
