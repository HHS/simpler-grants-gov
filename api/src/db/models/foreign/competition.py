from src.db.models.legacy_mixin import competition_mixin

from . import foreignbase


class Tcompetition(foreignbase.ForeignBase, competition_mixin.TcompetitionMixin):
    __tablename__ = "tcompetition"
