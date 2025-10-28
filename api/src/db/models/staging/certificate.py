from src.db.models.legacy_mixin.certificate_mixin import TcertificateMixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tcertificate(StagingBase, TcertificateMixin, StagingParamMixin):
    __tablename__ = "tcertificate"
