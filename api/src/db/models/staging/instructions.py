from sqlalchemy.orm import Mapped, foreign, relationship

from src.db.models.legacy_mixin import instructions_mixin
from src.db.models.staging.competition import Tcompetition
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tinstructions(StagingBase, instructions_mixin.TinstructionsMixin, StagingParamMixin):
    __tablename__ = "tinstructions"

    competition: Mapped[Tcompetition | None] = relationship(
        Tcompetition,
        primaryjoin=lambda: Tinstructions.comp_id == foreign(Tcompetition.comp_id),
        uselist=False,
    ) 