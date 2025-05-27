#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

from src.db.models.legacy_mixin import instructions_mixin

from . import foreignbase


class Tinstructions(foreignbase.ForeignBase, instructions_mixin.TinstructionsMixin):
    __tablename__ = "tinstructions"
