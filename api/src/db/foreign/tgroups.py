#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

from src.db.legacy_mixin import tgroups_mixin

from . import foreignbase


class Tgroups(foreignbase.ForeignBase, tgroups_mixin.TGroupsMixin):
    __tablename__ = "tgroups"
