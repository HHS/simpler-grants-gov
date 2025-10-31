from src.db.models.legacy_mixin.certificates_mixin import TcertificatesMixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tcertificates(StagingBase, TcertificatesMixin, StagingParamMixin):
    __tablename__ = "tcertificates"
