from src.db.models.legacy_mixin.certificate_mixin import TcertificateMixin

from . import foreignbase


class Tcertificate(foreignbase.ForeignBase, TcertificateMixin):
    __tablename__ = "tcertificate"
